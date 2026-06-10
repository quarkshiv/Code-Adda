import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pcp-secret';

function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// ── POST /api/auth/register ───────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body as {
      name: string; email: string; password: string;
    };

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const COLORS = ['#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
    const avatarColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    const user = await User.create({ name, email, passwordHash, avatarColor, provider: 'local' });

    const token = signToken(user._id.toString());

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, avatarColor: user.avatarColor },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = signToken(user._id.toString());

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, avatarColor: user.avatarColor },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, avatarColor: user.avatarColor },
    });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

export default router;
