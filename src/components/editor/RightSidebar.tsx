import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Users, Bot, History,
  PenTool, Send, Trash2, RotateCcw,
  Sparkles, Bug, Zap, FileCode, ChevronRight,
  Clock, Circle,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useEditorStore } from '@/store/useEditorStore';
import type { ActivePanel, AIMode } from '@/store/useEditorStore';
import { cn } from '@/lib/utils';
import { getAIResponse } from '@/services/aiService';
import { toast } from 'sonner';


interface RightSidebarProps {
  onSendMessage?: (content: string) => void;
}

const TABS: { id: ActivePanel; icon: React.ReactNode; label: string }[] = [
  { id: 'chat', icon: <MessageSquare className="w-4 h-4" />, label: 'Chat' },
  { id: 'participants', icon: <Users className="w-4 h-4" />, label: 'People' },
  { id: 'ai', icon: <Bot className="w-4 h-4" />, label: 'AI' },
  { id: 'history', icon: <History className="w-4 h-4" />, label: 'History' },
  { id: 'whiteboard', icon: <PenTool className="w-4 h-4" />, label: 'Board' },
];

export const RightSidebar: React.FC<RightSidebarProps> = ({ onSendMessage }) => {
  const {
    activePanel, setActivePanel,
    isRightSidebarOpen,
    users, typingUsers,
    messages, addMessage,
    snapshots, restoreSnapshot,
    code, language,
    aiMode, setAiMode,
    aiResponse, setAiResponse,
    isAiLoading, setIsAiLoading,
    myUser,
  } = useEditorStore();

  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    onSendMessage?.(chatInput.trim());
    setChatInput('');
  };

  const handleAI = async () => {
    setIsAiLoading(true);
    setAiResponse('');
    try {
      const response = await getAIResponse(aiMode, code, language.name);
      setAiResponse(response);
    } catch {
      toast.error('AI request failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isRightSidebarOpen) return null;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 300, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex-shrink-0 h-full bg-[#0D0D1A]/60 border-l border-white/8 flex flex-col backdrop-blur-lg overflow-hidden"
    >
      {/* Tab bar */}
      <div className="flex border-b border-white/8 flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all relative',
              activePanel === tab.id
                ? 'text-purple-300'
                : 'text-white/30 hover:text-white/60'
            )}
            title={tab.label}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {activePanel === tab.id && (
              <motion.div
                layoutId="sidebar-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="flex-1 overflow-hidden flex flex-col"
          >
            {activePanel === 'chat' && (
              <ChatPanel
                messages={messages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                onSend={handleSendChat}
                typingUsers={typingUsers}
                users={users}
                messagesEndRef={messagesEndRef}
              />
            )}
            {activePanel === 'participants' && <ParticipantsPanel users={users} typingUsers={typingUsers} />}
            {activePanel === 'ai' && (
              <AIPanel
                aiMode={aiMode}
                setAiMode={setAiMode}
                aiResponse={aiResponse}
                isLoading={isAiLoading}
                onRun={handleAI}
                onClear={() => setAiResponse('')}
              />
            )}
            {activePanel === 'history' && <HistoryPanel snapshots={snapshots} onRestore={restoreSnapshot} />}
            {activePanel === 'whiteboard' && <WhiteboardPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

// --- Sub-panels ---

const ChatPanel: React.FC<{
  messages: ReturnType<typeof useEditorStore.getState>['messages'];
  chatInput: string;
  setChatInput: (v: string) => void;
  onSend: () => void;
  typingUsers: string[];
  users: ReturnType<typeof useEditorStore.getState>['users'];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}> = ({ messages, chatInput, setChatInput, onSend, typingUsers, users, messagesEndRef }) => (
  <>
    <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
      {messages.length === 0 && (
        <div className="text-center text-white/25 text-sm py-8">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No messages yet. Say hello! 👋
        </div>
      )}
      {messages.map((msg) => {
        const user = users.find((u) => u.id === msg.userId);
        return (
          <div key={msg.id} className="flex gap-2 group">
            <UserAvatar name={msg.userName} color={msg.userColor} size="xs" isOnline={!!user} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-xs font-semibold" style={{ color: msg.userColor }}>
                  {msg.userName}
                </span>
                <span className="text-[10px] text-white/25">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-white/75 break-words leading-relaxed">{msg.content}</p>
            </div>
          </div>
        );
      })}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-white/40 text-xs">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>

    <div className="p-3 border-t border-white/8 flex gap-2">
      <input
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
        placeholder="Send a message…"
        className="flex-1 bg-white/8 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/12 transition-all"
      />
      <button
        onClick={onSend}
        disabled={!chatInput.trim()}
        className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  </>
);

const ParticipantsPanel: React.FC<{
  users: ReturnType<typeof useEditorStore.getState>['users'];
  typingUsers: string[];
}> = ({ users, typingUsers }) => (
  <div className="p-4 space-y-2 overflow-y-auto flex-1 scrollbar-thin">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">
        Online — {users.length}
      </span>
      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
    </div>

    {users.length === 0 && (
      <div className="text-center text-white/25 text-sm py-8">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
        Just you here. Share the room link!
      </div>
    )}

    {users.map((user) => (
      <motion.div
        key={user.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 p-2.5 rounded-xl bg-white/3 hover:bg-white/6 transition-all group"
      >
        <UserAvatar
          name={user.name}
          color={user.color}
          size="sm"
          isTyping={typingUsers.includes(user.id)}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white/80 truncate">{user.name}</div>
          <div className="text-[11px] text-white/30">
            {typingUsers.includes(user.id) ? (
              <span className="text-yellow-400/70">Typing…</span>
            ) : (
              <span className="text-emerald-400/70 flex items-center gap-1">
                <Circle className="w-2 h-2 fill-current" /> Online
              </span>
            )}
          </div>
        </div>
        <div
          className="w-1.5 h-10 rounded-full opacity-40 flex-shrink-0"
          style={{ backgroundColor: user.color }}
        />
      </motion.div>
    ))}
  </div>
);

const AI_MODES: { id: AIMode; icon: React.ReactNode; label: string; desc: string }[] = [
  { id: 'explain', icon: <Sparkles className="w-4 h-4" />, label: 'Explain', desc: 'Understand the code' },
  { id: 'debug', icon: <Bug className="w-4 h-4" />, label: 'Debug', desc: 'Find & fix bugs' },
  { id: 'optimize', icon: <Zap className="w-4 h-4" />, label: 'Optimize', desc: 'Improve performance' },
  { id: 'comments', icon: <FileCode className="w-4 h-4" />, label: 'Comment', desc: 'Add documentation' },
];

const AIPanel: React.FC<{
  aiMode: AIMode;
  setAiMode: (m: AIMode) => void;
  aiResponse: string;
  isLoading: boolean;
  onRun: () => void;
  onClear: () => void;
}> = ({ aiMode, setAiMode, aiResponse, isLoading, onRun, onClear }) => (
  <div className="flex flex-col h-full overflow-hidden">
    <div className="p-3 border-b border-white/8 flex-shrink-0">
      <p className="text-xs text-white/40 mb-2">Select an AI action for your code:</p>
      <div className="grid grid-cols-2 gap-1.5">
        {AI_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setAiMode(mode.id)}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all',
              aiMode === mode.id
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-200'
                : 'bg-white/5 border border-white/8 text-white/50 hover:bg-white/8 hover:text-white/70'
            )}
          >
            <span className={aiMode === mode.id ? 'text-purple-400' : 'text-white/30'}>{mode.icon}</span>
            <div>
              <div className="font-semibold">{mode.label}</div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onRun}
        disabled={isLoading}
        className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <Bot className="w-4 h-4" />
            Analyze Code
          </>
        )}
      </button>
    </div>

    <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
      {isLoading && (
        <div className="space-y-2">
          {[80, 60, 90, 50, 70].map((w, i) => (
            <div
              key={i}
              className="h-3 bg-white/8 rounded-full animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}
      {!isLoading && !aiResponse && (
        <div className="text-center text-white/25 text-sm py-8">
          <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Select a mode and click Analyze Code
        </div>
      )}
      {!isLoading && aiResponse && (
        <div className="text-sm text-white/75 prose prose-invert prose-sm max-w-none">
          <div className="whitespace-pre-wrap leading-relaxed">{aiResponse}</div>
          <button
            onClick={onClear}
            className="mt-3 flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      )}
    </div>
  </div>
);

const HistoryPanel: React.FC<{
  snapshots: ReturnType<typeof useEditorStore.getState>['snapshots'];
  onRestore: (snap: ReturnType<typeof useEditorStore.getState>['snapshots'][0]) => void;
}> = ({ snapshots, onRestore }) => (
  <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
    <p className="text-xs text-white/40 mb-3">
      Snapshots are saved when you press Save (Ctrl+S / ⌘S).
    </p>
    {snapshots.length === 0 && (
      <div className="text-center text-white/25 text-sm py-8">
        <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
        No snapshots yet. Save your code!
      </div>
    )}
    {snapshots.map((snap) => (
      <div
        key={snap.id}
        className="group p-3 rounded-xl bg-white/3 border border-white/8 hover:border-purple-500/30 hover:bg-white/6 transition-all"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-white/30 flex-shrink-0" />
              <span className="text-xs text-white/40">
                {snap.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-xs text-white/60 truncate">{snap.description}</p>
            <p className="text-[10px] text-white/25 mt-0.5">
              {snap.code.split('\n').length} lines
            </p>
          </div>
          <button
            onClick={() => onRestore(snap)}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-semibold transition-all hover:bg-purple-500/30"
          >
            <RotateCcw className="w-3 h-3" />
            Restore
          </button>
        </div>
      </div>
    ))}
  </div>
);

const WhiteboardPanel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#A855F7');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#0D0D1A' : color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 5 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const COLORS = ['#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#ffffff', '#64748b'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-white/8 flex-wrap flex-shrink-0">
        <button
          onClick={() => setTool('pen')}
          className={cn('p-1.5 rounded text-xs transition-all', tool === 'pen' ? 'bg-purple-500/30 text-purple-300' : 'text-white/40 hover:bg-white/8')}
          title="Pen"
        >
          <PenTool className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={cn('p-1.5 rounded text-xs transition-all', tool === 'eraser' ? 'bg-white/20 text-white' : 'text-white/40 hover:bg-white/8')}
          title="Eraser"
        >
          ◻
        </button>
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pen'); }}
              className={cn('w-4 h-4 rounded-full border-2 transition-transform hover:scale-110', color === c && tool === 'pen' ? 'border-white' : 'border-transparent')}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <input
          type="range" min="1" max="15" value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-16 accent-purple-500"
        />
        <button
          onClick={clearCanvas}
          className="ml-auto p-1.5 rounded text-white/30 hover:text-white/60 hover:bg-white/8 transition-all"
          title="Clear"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden bg-[#0a0a18] relative">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <canvas
          ref={canvasRef}
          width={280}
          height={400}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{ touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
        />
      </div>
    </div>
  );
};
