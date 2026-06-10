import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code2, Copy, Save, Download, Play, Settings,
  ChevronLeft, Wifi, WifiOff, Clock, Trophy,
  Check, Loader2, LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useEditorStore, LANGUAGES } from '@/store/useEditorStore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EditorNavbarProps {
  roomId: string;
  onRun: () => void;
  onSave: () => void;
  isConnected?: boolean;
}

const LanguageIcon: React.FC<{ icon: string; color: string }> = ({ icon, color }) => (
  <span className="font-mono font-bold text-[11px]" style={{ color }}>
    {icon}
  </span>
);

const LANG_COLORS: Record<string, string> = {
  JS: '#F7DF1E',
  TS: '#3178C6',
  PY: '#4B8BBE',
  JV: '#E76F00',
  'C++': '#00599C',
  C: '#A8B9CC',
};

export const EditorNavbar: React.FC<EditorNavbarProps> = ({
  roomId,
  onRun,
  onSave,
  isConnected = true,
}) => {
  const navigate = useNavigate();
  const {
    language, setLanguage,
    isRunning,
    users,
    isInterviewMode, setIsInterviewMode,
    interviewTimeLeft,
    code,
    isLeftSidebarOpen, setIsLeftSidebarOpen,
  } = useEditorStore();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Signed out successfully');
  };

  const [copied, setCopied] = React.useState(false);

  const copyRoomLink = useCallback(() => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    toast.success('Room ID copied!');
    setTimeout(() => setCopied(false), 2000);
  }, [roomId]);

  const exportCode = () => {
    const ext: Record<string, string> = {
      javascript: 'js', typescript: 'ts', python: 'py',
      java: 'java', cpp: 'cpp', c: 'c',
    };
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${ext[language.name] || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Code exported!');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-14 bg-[#0D0D1A]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0 relative z-50 shadow-sm shadow-purple-500/5"
    >
      {/* LEFT: Logo + room info */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          className="text-white/50 hover:text-white p-1.5 h-auto"
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform duration-300', !isLeftSidebarOpen && 'rotate-180')} />
        </Button>

        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-wide hidden sm:block">
            CodeAdda
          </span>
        </button>

        <div className="w-px h-4 bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="font-mono text-xs bg-white/5 border-white/15 text-white/70 hidden sm:flex"
          >
            {roomId.slice(0, 8)}…
          </Badge>
          <button
            onClick={copyRoomLink}
            className="text-white/40 hover:text-white/80 transition-colors p-1"
            title="Copy room link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Connection status */}
        <div className={cn('flex items-center gap-1 text-xs', isConnected ? 'text-emerald-400' : 'text-red-400')}>
          {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="hidden md:block">{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Center: Language & Run */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">
          <span
            className="font-mono font-bold text-xs"
            style={{ color: LANG_COLORS[language.icon] }}
          >
            {language.icon}
          </span>
          <span className="text-sm font-semibold text-white/90">
            {language.label}
          </span>
        </div>

        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
        >
          {isRunning ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          Run
        </button>
      </div>

      {/* RIGHT: Interview mode, save, export, avatars */}
      <div className="flex items-center gap-2">
        {/* Interview timer */}
        {isInterviewMode && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-mono font-semibold"
          >
            <Clock className="w-3.5 h-3.5" />
            {formatTime(interviewTimeLeft)}
          </motion.div>
        )}

        {/* Interview mode toggle */}
        <button
          onClick={() => setIsInterviewMode(!isInterviewMode)}
          title={isInterviewMode ? 'Exit interview mode' : 'Start interview mode'}
          className={cn(
            'p-1.5 rounded-lg transition-all',
            isInterviewMode
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-white/40 hover:text-white/80 hover:bg-white/8'
          )}
        >
          <Trophy className="w-4 h-4" />
        </button>

        <button
          onClick={onSave}
          title="Save snapshot"
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
        >
          <Save className="w-4 h-4" />
        </button>

        <button
          onClick={exportCode}
          title="Export code"
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
        >
          <Download className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-white/10" />

        {/* Presence avatars */}
        <div className="flex -space-x-2">
          {users.slice(0, 4).map((u) => (
            <UserAvatar key={u.id} name={u.name} color={u.color} size="sm" isOnline />
          ))}
          {users.length > 4 && (
            <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#0D0D1A] flex items-center justify-center text-xs text-white/60 font-semibold">
              +{users.length - 4}
            </div>
          )}
        </div>

        {/* Signed-in user menu */}
        {user && (
          <div className="relative ml-1">
            <button
              id="user-menu-btn"
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/8 transition-all group"
              title={user.user_metadata?.full_name ?? user.email}
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                  className="w-7 h-7 rounded-full border-2 border-purple-500/50 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-purple-500/50">
                  {(user.user_metadata?.full_name ?? user.email ?? 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-white/70 text-xs font-medium hidden md:block max-w-[100px] truncate">
                {user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0]}
              </span>
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                {/* Click-away backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-[#0d0d1a]/95 backdrop-blur-xl shadow-2xl z-50 p-1 overflow-hidden"
                  style={{ boxShadow: '0 0 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)' }}
                >
                  <div className="px-3 py-2.5 border-b border-white/8 mb-1">
                    <p className="text-white text-sm font-medium truncate">
                      {user.user_metadata?.full_name ?? 'User'}
                    </p>
                    <p className="text-white/40 text-xs truncate">{user.email}</p>
                  </div>
                  <button
                    id="signout-btn"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-sm transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.header>
  );
};
