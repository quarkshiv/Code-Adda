import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Users, Zap, Play, Bot, History, Mic,
  GitBranch, Trophy, PenTool, Copy, Check,
  ArrowRight, Globe, Shield, Cpu, Star,
  ChevronRight, Plus, Hash,
} from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────
interface RecentRoom {
  id: string;
  name: string;
  lang: string;
  lastVisited: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: <Users className="w-5 h-5" />, title: 'Live Collaboration', desc: 'Multi-user editing with real-time sync and live cursors', color: '#3B82F6' },
  { icon: <Bot className="w-5 h-5" />, title: 'AI Assistant', desc: 'Explain, debug, optimize and auto-comment your code instantly', color: '#A855F7' },
  { icon: <Play className="w-5 h-5" />, title: 'Code Execution', desc: 'Run C, C++, Java, Python, JS, TS — powered by Judge0', color: '#10B981' },
  { icon: <History className="w-5 h-5" />, title: 'Code History', desc: 'Save snapshots and restore any version with timeline view', color: '#F59E0B' },
  { icon: <Trophy className="w-5 h-5" />, title: 'Interview Mode', desc: 'Timed sessions with curated problems and hints', color: '#EF4444' },
  { icon: <PenTool className="w-5 h-5" />, title: 'Whiteboard', desc: 'Collaborative canvas for system design and architecture', color: '#EC4899' },
  { icon: <Mic className="w-5 h-5" />, title: 'Voice Chat', desc: 'WebRTC voice rooms — discuss while you code', color: '#06B6D4' },
  { icon: <GitBranch className="w-5 h-5" />, title: 'Version Control', desc: 'Snapshot timeline with one-click restore', color: '#8B5CF6' },
];

const LANG_BADGES = [
  { label: 'JavaScript', color: '#F7DF1E', bg: '#F7DF1E15' },
  { label: 'TypeScript', color: '#3178C6', bg: '#3178C615' },
  { label: 'Python', color: '#4B8BBE', bg: '#4B8BBE15' },
  { label: 'Java', color: '#E76F00', bg: '#E76F0015' },
  { label: 'C++', color: '#00599C', bg: '#00599C15' },
  { label: 'C', color: '#A8B9CC', bg: '#A8B9CC15' },
];

const FLOATING_CODE_SNIPPETS = [
  'const collab = await Room.join(id)',
  'def solve(nums: List[int]) -> int:',
  'SELECT * FROM rooms WHERE active = true',
  'function debounce(fn, ms) {',
  'git commit -m "feat: realtime sync"',
  'O(n log n) → O(n) ✓',
];

// ─── Floating Code Pills ──────────────────────────────────────────────────────
const FloatingCodePill: React.FC<{ text: string; delay: number; x: number; y: number }> = ({ text, delay, x, y }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{
      opacity: [0, 0.6, 0.6, 0],
      y: [20, -20, -40, -80],
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      repeatDelay: 4,
      ease: 'easeOut',
    }}
    className="absolute font-mono text-xs text-white/50 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full pointer-events-none backdrop-blur-sm whitespace-nowrap"
    style={{ left: `${x}%`, top: `${y}%` }}
  >
    {text}
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Index: React.FC = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('pcp_recent_rooms');
    if (stored) setRecentRooms(JSON.parse(stored));
  }, []);

  const saveRecentRoom = (id: string, name: string, lang = 'JavaScript') => {
    const room: RecentRoom = { id, name, lang, lastVisited: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem('pcp_recent_rooms') || '[]') as RecentRoom[];
    const updated = [room, ...existing.filter((r) => r.id !== id)].slice(0, 5);
    localStorage.setItem('pcp_recent_rooms', JSON.stringify(updated));
  };

  const createRoom = async () => {
    setIsCreating(true);
    try {
      const newRoomId = uuidv4();
      const name = roomName.trim() || `Room ${newRoomId.slice(0, 6)}`;

      const { error } = await supabase
        .from('rooms')
        .insert([{ id: newRoomId, name, created_at: new Date().toISOString() }]);

      if (error && error.code !== '23505') {
        // If table doesn't exist yet, navigate anyway
        console.warn('Supabase insert warning:', error.message);
      }

      saveRecentRoom(newRoomId, name);
      toast.success('Room created! 🚀');
      navigate(`/editor/${newRoomId}`);
    } catch (err) {
      // Navigate anyway — room will be created on-demand
      const newRoomId = uuidv4();
      navigate(`/editor/${newRoomId}`);
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    const id = roomId.trim();
    if (!id) {
      toast.error('Enter a room ID');
      return;
    }
    setIsJoining(true);
    try {
      saveRecentRoom(id, `Room ${id.slice(0, 6)}`);
      navigate(`/editor/${id}`);
    } finally {
      setIsJoining(false);
    }
  };

  const copyExampleId = () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0D0D1A] overflow-x-hidden">
      {/* ── Navbar ───────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-[#0D0D1A]/80 border-b border-white/5"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Code2 className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">CodeAdda</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/50">
          <a href="#features" className="hover:text-white/80 transition-colors hidden md:block">Features</a>
          <a href="#languages" className="hover:text-white/80 transition-colors hidden md:block">Languages</a>
          <button
            onClick={createRoom}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold transition-all shadow-lg shadow-purple-500/20"
          >
            Start Coding
          </button>
        </div>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #6366f1 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Floating code pills */}
        {FLOATING_CODE_SNIPPETS.map((text, i) => (
          <FloatingCodePill
            key={i}
            text={text}
            delay={i * 1.5}
            x={5 + (i * 15) % 80}
            y={10 + (i * 13) % 70}
          />
        ))}

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-purple-300 text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            CodeAdda — Real-Time Collaborative Coding
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight"
          >
            Code Together,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-blue-400">
              Build Faster
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            A VS Code-inspired collaborative editor with live cursors, AI assistance,
            multi-language execution, interview mode, and real-time presence — all in your browser.
          </motion.p>

          {/* CTA cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-stretch max-w-2xl mx-auto mb-12"
          >
            {/* Create room card */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl hover:border-purple-500/40 hover:bg-white/8 transition-all group">
              <div className="text-left mb-3">
                <div className="flex items-center gap-2 text-white font-semibold mb-1">
                  <Plus className="w-4 h-4 text-purple-400" />
                  Create Room
                </div>
                <p className="text-white/40 text-xs">Start a new collaborative session</p>
              </div>
              <input
                placeholder="Room name (optional)"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createRoom()}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 mb-3 transition-all"
              />
              <motion.button
                onClick={createRoom}
                disabled={isCreating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 fill-current" />
                )}
                {isCreating ? 'Creating…' : 'Create & Join'}
              </motion.button>
            </div>

            {/* Join room card */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl hover:border-blue-500/40 hover:bg-white/8 transition-all group">
              <div className="text-left mb-3">
                <div className="flex items-center gap-2 text-white font-semibold mb-1">
                  <Hash className="w-4 h-4 text-blue-400" />
                  Join Room
                </div>
                <p className="text-white/40 text-xs">Enter an existing room ID</p>
              </div>
              <input
                placeholder="Room ID or link…"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500/50 mb-3 transition-all"
              />
              <motion.button
                onClick={joinRoom}
                disabled={isJoining || !roomId.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 rounded-xl bg-white/8 border border-white/15 hover:bg-white/12 hover:border-blue-500/40 text-white font-semibold text-sm transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                {isJoining ? 'Joining…' : 'Join Room'}
              </motion.button>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8 text-sm"
          >
            {[
              { value: '6', label: 'Languages', icon: <Globe className="w-4 h-4" /> },
              { value: 'AI', label: 'Powered', icon: <Bot className="w-4 h-4" /> },
              { value: '∞', label: 'Collaborators', icon: <Users className="w-4 h-4" /> },
              { value: '0', label: 'Setup Required', icon: <Zap className="w-4 h-4" /> },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 text-white/40">
                <span className="text-purple-400/60">{stat.icon}</span>
                <span className="font-bold text-white/70">{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Recent Rooms ─────────────────────────────────── */}
      {recentRooms.length > 0 && (
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-white/70 mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              Recent Rooms
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {recentRooms.map((room) => (
                <motion.button
                  key={room.id}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/editor/${room.id}`)}
                  className="flex flex-col items-start gap-1 p-3 rounded-xl bg-white/4 border border-white/8 hover:border-purple-500/30 hover:bg-white/7 transition-all text-left"
                >
                  <div className="text-sm font-semibold text-white/70 truncate w-full">{room.name}</div>
                  <div className="text-xs text-white/30 truncate w-full font-mono">{room.id.slice(0, 8)}…</div>
                  <div className="text-[10px] text-white/20 mt-1">
                    {new Date(room.lastVisited).toLocaleDateString()}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Features Grid ────────────────────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Everything for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  productive teams
                </span>
              </h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto">
                A fully-featured coding environment, ready in seconds — no installs, no config.
              </p>
            </motion.div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="p-5 rounded-2xl bg-white/4 border border-white/8 hover:border-white/16 hover:bg-white/7 transition-all group cursor-default"
                style={{
                  boxShadow: `0 0 0 0 ${feat.color}`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${feat.color}20`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 0 transparent';
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: feat.color + '20', color: feat.color }}
                >
                  {feat.icon}
                </div>
                <h3 className="text-sm font-bold text-white/80 mb-1.5">{feat.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Language badges ───────────────────────────────── */}
      <section id="languages" className="py-16 px-6 bg-white/2 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white/70 mb-8">
            Run code in 6 languages
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {LANG_BADGES.map((lang) => (
              <motion.div
                key={lang.label}
                whileHover={{ scale: 1.08, y: -2 }}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border transition-all cursor-default"
                style={{ borderColor: lang.color + '40', backgroundColor: lang.bg, color: lang.color }}
              >
                <span className="font-bold text-sm">{lang.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Editor preview mockup ─────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-500/10"
          >
            {/* Fake editor chrome */}
            <div className="bg-[#0D0D1A] px-4 py-3 border-b border-white/8 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-white/30 font-mono">codeadda — collaborative session</span>
              </div>
              <div className="flex -space-x-2">
                {['#3B82F6', '#A855F7', '#10B981'].map((c) => (
                  <div key={c} className="w-5 h-5 rounded-full border-2 border-[#0D0D1A]" style={{ backgroundColor: c + '80' }} />
                ))}
              </div>
            </div>

            <div className="flex bg-[#080810] min-h-64">
              {/* Line numbers */}
              <div className="px-4 py-4 text-right text-white/15 font-mono text-sm select-none border-r border-white/5 min-w-[50px]">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="leading-6">{i + 1}</div>
                ))}
              </div>

              {/* Code */}
              <div className="flex-1 p-4 font-mono text-sm overflow-hidden">
                <div className="space-y-0 leading-6">
                  <div><span className="text-purple-400">function</span><span className="text-blue-300"> twoSum</span><span className="text-white/60">(nums, target) {'{'}</span></div>
                  <div className="pl-4"><span className="text-purple-400">const</span><span className="text-white/80"> map = </span><span className="text-purple-400">new</span><span className="text-emerald-300"> Map</span><span className="text-white/60">();</span></div>
                  <div className="pl-4 text-white/40">// Use hash map for O(n) solution</div>
                  <div className="pl-4"><span className="text-purple-400">for</span><span className="text-white/60"> (</span><span className="text-purple-400">let</span><span className="text-white/80"> i = </span><span className="text-amber-300">0</span><span className="text-white/60">; i &lt; nums.length; i++) {'{'}</span></div>
                  <div className="pl-8"><span className="text-purple-400">const</span><span className="text-white/80"> complement = target - nums[i];</span></div>
                  <div className="pl-8 relative">
                    <span className="text-purple-400">if</span><span className="text-white/60"> (map.has(complement)) </span>
                    {/* Cursor */}
                    <span className="inline-block w-0.5 h-4 bg-blue-400 animate-pulse align-middle" />
                    <div className="absolute -top-5 left-32 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded font-sans whitespace-nowrap">Shiv</div>
                  </div>
                  <div className="pl-12"><span className="text-purple-400">return</span><span className="text-white/60"> [map.get(complement), i];</span></div>
                  <div className="pl-8"><span className="text-white/60">{'}'}</span></div>
                  <div className="pl-8"><span className="text-white/80">map.set(nums[i], i);</span></div>
                  <div className="pl-4"><span className="text-white/60">{'}'}</span></div>
                  <div className="pl-4"><span className="text-purple-400">return</span><span className="text-white/60"> [];</span></div>
                  <div><span className="text-white/60">{'}'}</span></div>
                </div>
              </div>

              {/* Mini right panel mockup */}
              <div className="w-48 border-l border-white/5 p-3 hidden md:block">
                <div className="text-[10px] text-white/30 font-semibold uppercase mb-2">Online — 3</div>
                {[
                  { name: 'Shiv', color: '#3B82F6', typing: true },
                  { name: 'Rahul', color: '#A855F7', typing: false },
                  { name: 'Aman', color: '#10B981', typing: false },
                ].map((u) => (
                  <div key={u.name} className="flex items-center gap-2 py-1.5">
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: u.color + '33', color: u.color }}>
                        {u.name[0]}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#080810] ${u.typing ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
                    </div>
                    <div>
                      <div className="text-[11px] text-white/60">{u.name}</div>
                      {u.typing && <div className="text-[9px] text-yellow-400/60">typing…</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-10 rounded-3xl bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/20 backdrop-blur-xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30">
              <Code2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Start coding in seconds</h2>
            <p className="text-white/40 mb-8 leading-relaxed">
              No account needed. Create a room, share the link, and start collaborating instantly.
            </p>
            <motion.button
              onClick={createRoom}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-lg transition-all shadow-2xl shadow-purple-500/30 flex items-center gap-3 mx-auto"
            >
              <Zap className="w-5 h-5 fill-current" />
              Create Free Room
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/25">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-purple-400/50" />
            <span className="font-semibold">CodeAdda</span>
            <span>— Built for developers, by developers</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Monaco Editor</span>
            <span>Supabase Realtime</span>
            <span>Judge0</span>
            <span>Framer Motion</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
