import mongoose, { Schema, Document } from 'mongoose';

// ── Room ──────────────────────────────────────────────────────────
export interface IRoom extends Document {
  _id: string;
  name: string;
  language: number;
  code: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

const RoomSchema = new Schema<IRoom>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    language: { type: Number, default: 63 },
    code: { type: String, default: '' },
    createdBy: { type: String },
    isPublic: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    _id: false, // we provide our own UUID _id
  }
);

export const Room = mongoose.model<IRoom>('Room', RoomSchema);

// ── Chat Message ──────────────────────────────────────────────────
export interface IChatMessage extends Document {
  roomId: string;
  userId: string;
  userName: string;
  userColor: string;
  content: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    roomId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userColor: { type: String, required: true },
    content: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

// ── Code Snapshot ─────────────────────────────────────────────────
export interface ISnapshot extends Document {
  roomId: string;
  code: string;
  language: number;
  description: string;
  createdBy?: string;
  createdAt: Date;
}

const SnapshotSchema = new Schema<ISnapshot>(
  {
    roomId: { type: String, required: true, index: true },
    code: { type: String, required: true },
    language: { type: Number, required: true },
    description: { type: String, default: 'Snapshot' },
    createdBy: { type: String },
  },
  { timestamps: true }
);

// Keep only last 50 snapshots per room
SnapshotSchema.index({ roomId: 1, createdAt: -1 });

export const Snapshot = mongoose.model<ISnapshot>('Snapshot', SnapshotSchema);

// ── User (for optional auth) ──────────────────────────────────────
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  avatarColor: string;
  provider: 'local' | 'github' | 'google';
  providerId?: string;
  rooms: string[];
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    avatarColor: { type: String, default: '#A855F7' },
    provider: { type: String, enum: ['local', 'github', 'google'], default: 'local' },
    providerId: { type: String },
    rooms: [{ type: String }],
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
