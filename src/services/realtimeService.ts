import { supabase } from './supabaseClient';
import type { UserPresence, ChatMessage } from '@/store/useEditorStore';
import { USER_COLORS } from '@/store/useEditorStore';

type RealtimeCallbacks = {
  onUsersChange: (users: UserPresence[]) => void;
  onCodeChange: (code: string) => void;
  onCursorChange: (userId: string, cursor: { line: number; column: number }) => void;
  onChatMessage: (msg: ChatMessage) => void;
  onTypingChange: (userIds: string[]) => void;
};

let channel: ReturnType<typeof supabase.channel> | null = null;
let isSubscribed = false;
let presenceInterval: ReturnType<typeof setInterval> | null = null;

/** Extract UserPresence[] from Supabase presenceState */
function extractUsers(ch: NonNullable<typeof channel>): UserPresence[] {
  const presenceState = ch.presenceState();
  return Object.values(presenceState)
    .flat()
    .map((p: any, i: number) => ({
      id: p.id || `user-${i}`,
      name: p.name || 'Anonymous',
      color: p.color || USER_COLORS[i % USER_COLORS.length],
      avatar: p.avatar,
      cursor: p.cursor,
      isTyping: p.isTyping,
    }));
}

export function joinRoom(
  roomId: string,
  myUser: UserPresence,
  callbacks: RealtimeCallbacks
) {
  // Clean up any existing channel first
  if (channel) {
    isSubscribed = false;
    supabase.removeChannel(channel);
    channel = null;
  }

  console.log('[Realtime] Creating channel for room:', roomId, '| my tab ID:', myUser.id);

  channel = supabase.channel(`room:${roomId}`, {
    config: {
      presence: { key: myUser.id },
      broadcast: { self: false },
    },
  });

  // Presence tracking — sync fires whenever anyone joins/leaves
  channel.on('presence', { event: 'sync' }, () => {
    console.log('[Realtime] Presence sync fired');
    callbacks.onUsersChange(extractUsers(channel!));
  });

  // Also listen for join/leave for faster updates
  channel.on('presence', { event: 'join' }, ({ newPresences }) => {
    console.log('[Realtime] User joined:', newPresences.map((p: any) => p.name));
    callbacks.onUsersChange(extractUsers(channel!));
  });

  channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
    console.log('[Realtime] User left:', leftPresences.map((p: any) => p.name));
    callbacks.onUsersChange(extractUsers(channel!));
  });

  // Code broadcast
  channel.on('broadcast', { event: 'code_change' }, ({ payload }) => {
    if (payload.userId !== myUser.id) {
      callbacks.onCodeChange(payload.code as string);
    }
  });

  // Cursor broadcast
  channel.on('broadcast', { event: 'cursor_change' }, ({ payload }) => {
    if (payload.userId !== myUser.id) {
      callbacks.onCursorChange(payload.userId as string, payload.cursor as { line: number; column: number });
    }
  });

  // Chat messages — filter by tabId (per-tab dedup), NOT userId (display identity)
  channel.on('broadcast', { event: 'chat_message' }, ({ payload }) => {
    console.log('[Realtime] Received chat_message payload:', payload);
    const raw = payload.message as ChatMessage;
    const senderTabId = payload.tabId as string | undefined;
    // Skip if this message came from our own tab
    if (senderTabId && senderTabId === myUser.id) {
      console.log('[Realtime] Skipping own chat message (tabId match)');
      return;
    }
    // Rehydrate the timestamp — JSON serialization turns the Date into a string,
    // which would crash the chat render (msg.timestamp.toLocaleTimeString()).
    const msg: ChatMessage = {
      ...raw,
      timestamp: new Date(raw.timestamp),
    };
    console.log('[Realtime] Delivering chat message from:', msg.userName, '| content:', msg.content);
    callbacks.onChatMessage(msg);
  });


  // Typing indicator
  channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
    callbacks.onTypingChange(payload.typingUsers as string[]);
  });

  channel.subscribe(async (status) => {
    console.log('[Realtime] Channel status:', status, '| room:', roomId);
    if (status === 'SUBSCRIBED') {
      isSubscribed = true;
      const trackData = {
        id: myUser.id,
        name: myUser.name,
        color: myUser.color,
        avatar: myUser.avatar,
      };
      await channel!.track(trackData);
      console.log('[Realtime] ✅ Joined room:', roomId, 'as', myUser.name, '(tabId:', myUser.id, ')');
      console.log('[Realtime] Room members:', Object.keys(channel!.presenceState()));

      // Periodically re-track to force Supabase to re-sync presence on all clients.
      // This fixes the asymmetry where one tab sees both users but the other only sees itself.
      if (presenceInterval) clearInterval(presenceInterval);
      presenceInterval = setInterval(() => {
        if (channel && isSubscribed) {
          channel.track(trackData).catch(() => {});
        }
      }, 10_000);
    } else if (status === 'CHANNEL_ERROR') {
      isSubscribed = false;
      console.error('[Realtime] ❌ Channel error — will retry');
    } else if (status === 'CLOSED') {
      isSubscribed = false;
      console.log('[Realtime] Channel closed');
    }
  });

  return channel;
}

function safeSend(payload: Parameters<NonNullable<typeof channel>['send']>[0]) {
  if (!channel || !isSubscribed) {
    console.warn('[Realtime] Cannot send — channel not ready. subscribed:', isSubscribed, 'channel:', !!channel);
    return;
  }
  try {
    const res = channel.send(payload);
    // If it returns a Promise (e.g. ack mode), catch any rejections silently
    if (res && typeof (res as any).then === 'function') {
      (res as Promise<any>).catch((err: any) => console.warn('[Realtime] send() promise error:', err));
    }
  } catch (err) {
    console.error('[Realtime] send() synchronous error:', err);
  }
}

export function broadcastCodeChange(code: string, userId: string) {
  safeSend({
    type: 'broadcast',
    event: 'code_change',
    payload: { code, userId },
  });
}

export function broadcastCursor(userId: string, cursor: { line: number; column: number }) {
  safeSend({
    type: 'broadcast',
    event: 'cursor_change',
    payload: { userId, cursor },
  });
}

export function broadcastChatMessage(msg: ChatMessage, tabId: string) {
  console.log('[Realtime] Sending chat_message:', { tabId, userName: msg.userName, content: msg.content });
  safeSend({
    type: 'broadcast',
    event: 'chat_message',
    payload: { message: msg, tabId },
  });
}

export function broadcastTyping(typingUsers: string[]) {
  safeSend({
    type: 'broadcast',
    event: 'typing',
    payload: { typingUsers },
  });
}

export async function leaveRoom() {
  if (presenceInterval) {
    clearInterval(presenceInterval);
    presenceInterval = null;
  }
  if (channel) {
    isSubscribed = false;
    await channel.untrack();
    await supabase.removeChannel(channel);
    channel = null;
  }
}

// Save code to DB
export async function saveCodeToRoom(roomId: string, code: string, language: number) {
  await supabase.from('rooms').upsert({
    id: roomId,
    code,
    language,
    updated_at: new Date().toISOString(),
  });
}

// Load code from DB
export async function loadRoomCode(roomId: string) {
  const { data } = await supabase
    .from('rooms')
    .select('code, language')
    .eq('id', roomId)
    .single();
  return data;
}

// Snapshots
export async function saveSnapshot(roomId: string, code: string, language: number, description: string) {
  const { data, error } = await supabase
    .from('snapshots')
    .insert([{ room_id: roomId, code, language, description, created_at: new Date().toISOString() }])
    .select()
    .single();
  return { data, error };
}

export async function loadSnapshots(roomId: string) {
  const { data } = await supabase
    .from('snapshots')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(20);
  return data || [];
}
