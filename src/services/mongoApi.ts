/**
 * MongoDB Backend API Service
 * Connects the frontend to the Express + MongoDB backend.
 * Falls back gracefully if backend is unavailable.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('pcp_token');
  
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export async function apiRegister(name: string, email: string, password: string) {
  const data = await apiRequest<{ success: boolean; token: string; user: AuthUser }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ name, email, password }) }
  );
  if (data.token) localStorage.setItem('pcp_token', data.token);
  return data;
}

export async function apiLogin(email: string, password: string) {
  const data = await apiRequest<{ success: boolean; token: string; user: AuthUser }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );
  if (data.token) localStorage.setItem('pcp_token', data.token);
  return data;
}

export async function apiGetMe() {
  return apiRequest<{ success: boolean; user: AuthUser }>('/auth/me');
}

export function apiLogout() {
  localStorage.removeItem('pcp_token');
}

// ── Rooms ─────────────────────────────────────────────────────────

export interface RoomData {
  _id: string;
  name: string;
  language: number;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export async function apiGetRoom(roomId: string): Promise<RoomData | null> {
  try {
    const data = await apiRequest<{ success: boolean; room: RoomData }>(`/rooms/${roomId}`);
    return data.room;
  } catch {
    return null; // graceful fallback
  }
}

export async function apiCreateRoom(id: string, name: string, language = 63) {
  try {
    const data = await apiRequest<{ success: boolean; room: RoomData }>(
      '/rooms',
      { method: 'POST', body: JSON.stringify({ id, name, language }) }
    );
    return data.room;
  } catch {
    return null;
  }
}

export async function apiSaveCode(roomId: string, code: string, language: number) {
  try {
    await apiRequest(`/rooms/${roomId}/code`, {
      method: 'PATCH',
      body: JSON.stringify({ code, language }),
    });
  } catch {
    // silent fail — Supabase realtime handles live state
  }
}

// ── Chat History ──────────────────────────────────────────────────

export interface ChatMsg {
  _id: string;
  roomId: string;
  userId: string;
  userName: string;
  userColor: string;
  content: string;
  createdAt: string;
}

export async function apiGetChatHistory(roomId: string): Promise<ChatMsg[]> {
  try {
    const data = await apiRequest<{ success: boolean; messages: ChatMsg[] }>(
      `/rooms/${roomId}/chat`
    );
    return data.messages;
  } catch {
    return [];
  }
}

export async function apiSaveChatMessage(
  roomId: string,
  payload: { userId: string; userName: string; userColor: string; content: string }
) {
  try {
    await apiRequest(`/rooms/${roomId}/chat`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    // silent fail
  }
}

// ── Snapshots ─────────────────────────────────────────────────────

export interface SnapshotData {
  _id: string;
  roomId: string;
  code: string;
  language: number;
  description: string;
  createdAt: string;
}

export async function apiGetSnapshots(roomId: string): Promise<SnapshotData[]> {
  try {
    const data = await apiRequest<{ success: boolean; snapshots: SnapshotData[] }>(
      `/rooms/${roomId}/snapshots`
    );
    return data.snapshots;
  } catch {
    return [];
  }
}

export async function apiSaveSnapshot(
  roomId: string,
  code: string,
  language: number,
  description: string,
  createdBy?: string
) {
  try {
    const data = await apiRequest<{ success: boolean; snapshot: SnapshotData }>(
      `/rooms/${roomId}/snapshots`,
      {
        method: 'POST',
        body: JSON.stringify({ code, language, description, createdBy }),
      }
    );
    return data.snapshot;
  } catch {
    return null;
  }
}

// ── Health check ──────────────────────────────────────────────────
export async function apiCheckHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    return data.success && data.mongodb === 'connected';
  } catch {
    return false;
  }
}

// ── Presence (server-side user tracking) ──────────────────────────

export interface PresenceUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

/** Send a heartbeat so the server knows we're still active */
export async function apiHeartbeat(
  roomId: string,
  user: { userId: string; userName: string; userColor: string; avatar?: string }
) {
  try {
    await apiRequest(`/rooms/${roomId}/presence`, {
      method: 'POST',
      body: JSON.stringify(user),
    });
  } catch {
    // silent
  }
}

/** Get all active users in a room */
export async function apiGetActiveUsers(roomId: string): Promise<PresenceUser[]> {
  try {
    const data = await apiRequest<{ success: boolean; users: PresenceUser[] }>(
      `/rooms/${roomId}/presence`
    );
    return data.users;
  } catch {
    return [];
  }
}

/** Tell the server we're leaving */
export async function apiLeavePresence(roomId: string, userId: string) {
  try {
    await apiRequest(`/rooms/${roomId}/presence`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  } catch {
    // silent
  }
}
