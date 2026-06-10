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

export default router;
