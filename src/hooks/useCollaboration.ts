import { useCallback, useEffect, useRef } from 'react';
import { useEditorStore, USER_COLORS, type UserPresence, type ChatMessage } from '@/store/useEditorStore';
import {
  joinRoom, leaveRoom,
  broadcastCodeChange, broadcastCursor, broadcastChatMessage, broadcastTyping,
  saveCodeToRoom, loadRoomCode,
} from '@/services/realtimeService';
import { v4 as uuidv4 } from 'uuid';
import type * as Monaco from 'monaco-editor';
import { useAuth } from '@/contexts/AuthContext';

const GUEST_NAMES = [
  'Aria', 'Blake', 'Casey', 'Drew', 'Ellis', 'Finley',
  'Gray', 'Harper', 'Indigo', 'Jordan', 'Kendall', 'Lane',
];

// Per-tab session ID (unique even across tabs of the same logged-in user)
// This is used ONLY for broadcast filtering — not for display
const TAB_SESSION_ID = uuidv4();

// Fallback guest identity (used only if not signed in)
let guestId = sessionStorage.getItem('pcp_user_id');
if (!guestId) {
  guestId = uuidv4();
  sessionStorage.setItem('pcp_user_id', guestId);
}

let guestName = sessionStorage.getItem('pcp_user_name');
if (!guestName) {
  guestName = GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)] + Math.floor(Math.random() * 99 + 1);
  sessionStorage.setItem('pcp_user_name', guestName);
}

export function useCollaboration(roomId: string, editorRef?: React.RefObject<Monaco.editor.IStandaloneCodeEditor | null>) {
  const {
    setCode,
    setUsers, setMyUser,
    addMessage,
    setTypingUsers,
    language,
  } = useEditorStore();

  // Use real Google identity if signed in, otherwise fall back to guest
  const { user } = useAuth();
  const myUserId = user?.id ?? guestId!;
  const myUserName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? guestName!;
  const myAvatar = user?.user_metadata?.avatar_url as string | undefined;

  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const mongoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  // Flag to prevent echoing back our own remote-applied changes
  const suppressBroadcast = useRef(false);

  const myColorIndex = parseInt(myUserId.charCodeAt(0).toString(), 10) % USER_COLORS.length;
  const myUser: UserPresence = {
    id: myUserId,
    name: myUserName,
    color: USER_COLORS[myColorIndex],
    avatar: myAvatar,
  };

  // Apply remote code directly to Monaco model (no state re-render = no lag)
  const applyRemoteCode = useCallback((remoteCode: string) => {
    suppressBroadcast.current = true;
    const editor = editorRef?.current;
    if (editor) {
      const model = editor.getModel();
      if (model && model.getValue() !== remoteCode) {
        const fullRange = model.getFullModelRange();
        model.pushEditOperations(
          [],
          [{ range: fullRange, text: remoteCode }],
          () => null
        );
      }
    } else {
      // Fallback if editor not mounted yet
      setCode(remoteCode);
    }
    suppressBroadcast.current = false;
  }, [editorRef, setCode]);

  useEffect(() => {
    setMyUser(myUser);

    // Load existing code from DB
    loadRoomCode(roomId).then((data) => {
      if (data?.code) {
        applyRemoteCode(data.code);
      }
    });

    // Join realtime channel — use TAB_SESSION_ID for broadcast filtering
    joinRoom(roomId, { ...myUser, id: TAB_SESSION_ID }, {
      onUsersChange: setUsers,
      onCodeChange: (remoteCode) => {
        applyRemoteCode(remoteCode);
      },
      onCursorChange: (_userId, _cursor) => {
        // cursor rendering handled separately
      },
      onChatMessage: (msg: ChatMessage) => addMessage(msg),
      onTypingChange: (userIds) => setTypingUsers(userIds.filter((id) => id !== TAB_SESSION_ID)),
    });

    return () => {
      leaveRoom();
      if (mongoSaveTimer.current) clearTimeout(mongoSaveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, myUserId]);

  // Broadcast code changes — NO debounce for real-time feel
  const broadcastCode = useCallback(
    (newCode: string) => {
      if (suppressBroadcast.current) return;
      broadcastCodeChange(newCode, TAB_SESSION_ID);
      // Debounce only the DB save (expensive), not the broadcast
      if (mongoSaveTimer.current) clearTimeout(mongoSaveTimer.current);
      mongoSaveTimer.current = setTimeout(() => {
        saveCodeToRoom(roomId, newCode, language.id);
      }, 2000);
    },
    [roomId, language.id]
  );

  const sendChatMessage = useCallback(
    (content: string) => {
      const msg: ChatMessage = {
        id: uuidv4(),
        userId: TAB_SESSION_ID,
        userName: myUserName,
        userColor: myUser.color,
        content,
        timestamp: new Date(),
      };
      // Add locally immediately (so sender sees it instantly)
      addMessage(msg);
      // Broadcast to other users
      broadcastChatMessage(msg);
    },
    [myUserName, myUser.color, addMessage]
  );

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isTyping) {
      broadcastTyping([TAB_SESSION_ID]);
      typingTimer.current = setTimeout(() => {
        broadcastTyping([]);
      }, 2000);
    } else {
      broadcastTyping([]);
    }
  }, []);

  return { broadcastCode, sendChatMessage, sendTypingIndicator, myUser, applyRemoteCode };
}
