import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import roomsRouter from './routes/rooms.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || '';

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://code-adda-fawn.vercel.app',
  ],
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, error: 'Too many requests' },
});
app.use('/api', limiter);

// ── Health check ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api/rooms', roomsRouter);
app.use('/api/auth', authRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── MongoDB Connection + Server Start ──────────────────────────────
async function main() {
  if (!MONGODB_URI || MONGODB_URI.includes('<username>')) {
    console.error('\n❌  MONGODB_URI is not set in .env');
    console.error('   Paste your Atlas connection string into .env as MONGODB_URI=...\n');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅  MongoDB Atlas connected');

    app.listen(PORT, () => {
      console.log(`🚀  API server running → http://localhost:${PORT}/api`);
      console.log(`📋  Health check → http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌  MongoDB connection failed:', (err as Error).message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('\n🔌  MongoDB disconnected on app termination');
  process.exit(0);
});

main();
