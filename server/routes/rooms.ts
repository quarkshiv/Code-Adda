import express from 'express';
import { Room, ChatMessage, Snapshot } from '../models/index.js';

const router = express.Router();

// ── GET /api/rooms/:id ─────────────────────────────────────────────
// Load a room (creates it if it doesn't exist — on-demand creation)
router.get('/:id', async (req, res) => {
  try {
    let room = await Room.findById(req.params.id);

    if (!room) {
      // Auto-create room on first access (no auth required)
      room = await Room.create({
        _id: req.params.id,
        name: `Room ${req.params.id.slice(0, 6)}`,
        language: 63,
        code: '',
      });
    }

    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── POST /api/rooms ────────────────────────────────────────────────
// Explicitly create a named room
router.post('/', async (req, res) => {
  try {
    const { id, name, language } = req.body as { id: string; name: string; language?: number };

    if (!id || !name) {
      return res.status(400).json({ success: false, error: 'id and name are required' });
    }

    const existing = await Room.findById(id);
    if (existing) {
      return res.json({ success: true, room: existing });
    }

    const room = await Room.create({ _id: id, name, language: language || 63, code: '' });
    res.status(201).json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── PATCH /api/rooms/:id/code ──────────────────────────────────────
// Save code to MongoDB (called on auto-save)
router.patch('/:id/code', async (req, res) => {
  try {
    const { code, language } = req.body as { code: string; language?: number };

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { code, ...(language && { language }) },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── GET /api/rooms/:id/chat ───────────────────────────────────────
// Load last 100 chat messages for a room
router.get('/:id/chat', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ roomId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── POST /api/rooms/:id/chat ──────────────────────────────────────
// Persist a chat message
router.post('/:id/chat', async (req, res) => {
  try {
    const { userId, userName, userColor, content } = req.body as {
      userId: string; userName: string; userColor: string; content: string;
    };

    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: 'content is required' });
    }

    const msg = await ChatMessage.create({
      roomId: req.params.id,
      userId,
      userName,
      userColor,
      content: content.trim(),
    });

    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── GET /api/rooms/:id/snapshots ──────────────────────────────────
// Get all snapshots for a room
router.get('/:id/snapshots', async (req, res) => {
  try {
    const snapshots = await Snapshot.find({ roomId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({ success: true, snapshots });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── POST /api/rooms/:id/snapshots ─────────────────────────────────
// Save a new snapshot
router.post('/:id/snapshots', async (req, res) => {
  try {
    const { code, language, description, createdBy } = req.body as {
      code: string; language: number; description?: string; createdBy?: string;
    };

    if (!code) {
      return res.status(400).json({ success: false, error: 'code is required' });
    }

    const snap = await Snapshot.create({
      roomId: req.params.id,
      code,
      language,
      description: description || `Snapshot ${new Date().toLocaleTimeString()}`,
      createdBy,
    });

    // Cleanup: keep only last 30 snapshots per room
    const all = await Snapshot.find({ roomId: req.params.id }).sort({ createdAt: -1 });
    if (all.length > 30) {
      const toDelete = all.slice(30).map((s) => s._id);
      await Snapshot.deleteMany({ _id: { $in: toDelete } });
    }

    res.status(201).json({ success: true, snapshot: snap });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── In-memory Presence Tracking ──────────────────────────────────
// Supabase Realtime presence is unreliable, so we track active users
// server-side via heartbeats. Users who stop heartbeating are pruned.

interface PresenceEntry {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  lastSeen: number;
}

const roomPresence = new Map<string, Map<string, PresenceEntry>>();
const PRESENCE_TIMEOUT_MS = 15_000; // 15 seconds

function pruneStale(roomId: string) {
  const room = roomPresence.get(roomId);
  if (!room) return;
  const now = Date.now();
  for (const [userId, entry] of room.entries()) {
    if (now - entry.lastSeen > PRESENCE_TIMEOUT_MS) {
      room.delete(userId);
    }
  }
  if (room.size === 0) roomPresence.delete(roomId);
}

// POST /api/rooms/:id/presence — heartbeat (called every 5s by each client)
router.post('/:id/presence', (req, res) => {
  try {
    const { userId, userName, userColor, avatar } = req.body as {
      userId: string; userName: string; userColor: string; avatar?: string;
    };
    if (!userId || !userName) {
      return res.status(400).json({ success: false, error: 'userId and userName are required' });
    }

    const roomId = req.params.id;
    if (!roomPresence.has(roomId)) {
      roomPresence.set(roomId, new Map());
    }
    roomPresence.get(roomId)!.set(userId, {
      id: userId,
      name: userName,
      color: userColor || '#A855F7',
      avatar,
      lastSeen: Date.now(),
    });

    pruneStale(roomId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /api/rooms/:id/presence — get all active users in a room
router.get('/:id/presence', (req, res) => {
  try {
    const roomId = req.params.id;
    pruneStale(roomId);
    const room = roomPresence.get(roomId);
    const users = room ? Array.from(room.values()).map(({ id, name, color, avatar }) => ({ id, name, color, avatar })) : [];
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// DELETE /api/rooms/:id/presence — user leaving
router.delete('/:id/presence', (req, res) => {
  try {
    const { userId } = req.body as { userId: string };
    const room = roomPresence.get(req.params.id);
    if (room) room.delete(userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
