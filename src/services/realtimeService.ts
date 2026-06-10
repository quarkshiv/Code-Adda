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

  channel = supabase.channel(`room:${roomId}`, {
    config: {
      presence: { key: myUser.id },
      broadcast: { self: true },
    },
  });

  // Presence tracking
  channel.on('presence', { event: 'sync' }, () => {
    const presenceState = channel!.presenceState<UserPresence>();
    const users: UserPresence[] = Object.values(presenceState)
      .flat()
      .map((p, i) => ({
        ...(p as unknown as UserPresence),
        color: USER_COLORS[i % USER_COLORS.length],
      }));
    callbacks.onUsersChange(users);
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

  // Chat messages (skip own — sender adds locally)
  channel.on('broadcast', { event: 'chat_message' }, ({ payload }) => {
    const msg = payload.message as ChatMessage;
    if (msg.userId !== myUser.id) {
      callbacks.onChatMessage(msg);
    }
  });

  // Typing indicator
  channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
    callbacks.onTypingChange(payload.typingUsers as string[]);
  });

  channel.subscribe(async (status) => {
    console.log('[Realtime] Channel status:', status);
    if (status === 'SUBSCRIBED') {
      isSubscribed = true;
      await channel!.track({
        id: myUser.id,
        name: myUser.name,
        color: myUser.color,
        avatar: myUser.avatar,
      });
      console.log('[Realtime] Joined room:', roomId, 'as', myUser.name);
    } else if (status === 'CHANNEL_ERROR') {
      isSubscribed = false;
      console.error('[Realtime] Channel error — will retry');
    } else if (status === 'CLOSED') {
      isSubscribed = false;
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

export function broadcastChatMessage(msg: ChatMessage) {
  safeSend({
    type: 'broadcast',
    event: 'chat_message',
    payload: { message: msg },
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
