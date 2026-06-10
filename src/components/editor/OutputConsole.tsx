import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Terminal, AlertCircle,
  Keyboard, Trash2, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { cn } from '@/lib/utils';

type ConsoleTab = 'output' | 'errors' | 'stdin';

export const OutputConsole: React.FC = () => {
  const {
    output, stderr,
    stdin, setStdin,
    isRunning,
    isOutputPanelOpen, setIsOutputPanelOpen,
    setOutput, setStderr,
  } = useEditorStore();

  const [activeTab, setActiveTab] = useState<ConsoleTab>('output');
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, stderr]);

  const hasError = !!stderr;
  const hasOutput = !!output;

  const TABS: { id: ConsoleTab; icon: React.ReactNode; label: string; badge?: number | boolean }[] = [
    {
      id: 'output',
      icon: <Terminal className="w-3.5 h-3.5" />,
      label: 'Output',
      badge: hasOutput,
    },
    {
      id: 'errors',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: 'Errors',
      badge: hasError,
    },
    {
      id: 'stdin',
      icon: <Keyboard className="w-3.5 h-3.5" />,
      label: 'Input (stdin)',
    },
  ];

  return (
    <div
      className={cn(
        'flex flex-col border-t border-white/8 bg-[#080810] transition-all duration-300 flex-shrink-0',
        isOutputPanelOpen ? 'h-52' : 'h-10'
      )}
    >
      {/* Console header */}
      <div className="flex items-center border-b border-white/8 h-10 flex-shrink-0 px-2">
        <button
          onClick={() => setIsOutputPanelOpen(!isOutputPanelOpen)}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors p-1 rounded mr-2"
        >
          {isOutputPanelOpen
            ? <ChevronDown className="w-3.5 h-3.5" />
            : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (!isOutputPanelOpen) setIsOutputPanelOpen(true);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all mr-1 relative',
              activeTab === tab.id && isOutputPanelOpen
                ? 'bg-white/8 text-white/80'
                : 'text-white/30 hover:text-white/50 hover:bg-white/5'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5',
                  tab.id === 'errors' ? 'bg-red-400' : 'bg-emerald-400'
                )}
              />
            )}
          </button>
        ))}

        {/* Status indicator */}
        <div className="ml-auto flex items-center gap-2 pr-2">
          {isRunning && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              Executing…
            </span>
          )}
          {!isRunning && hasOutput && !hasError && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              Success
            </span>
          )}
          {!isRunning && hasError && (
            <span className="flex items-center gap-1.5 text-xs text-red-400">
              <XCircle className="w-3.5 h-3.5" />
              Error
            </span>
          )}
          <button
            onClick={() => { setOutput(''); setStderr(''); }}
            className="p-1 text-white/20 hover:text-white/50 transition-colors rounded"
            title="Clear console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Panel body */}
      <AnimatePresence>
        {isOutputPanelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-hidden"
          >
            {activeTab === 'output' && (
              <div ref={outputRef} className="h-full overflow-y-auto p-3 scrollbar-thin">
                {isRunning && (
                  <div className="flex items-center gap-2 text-amber-400/70 text-sm font-mono animate-pulse">
                    <span className="w-2 h-2 bg-amber-400 rounded-full" />
                    Running your code…
                  </div>
                )}
                {!isRunning && !output && (
                  <div className="text-white/20 text-sm font-mono">
                    // Press Run to execute your code
                  </div>
                )}
                {output && (
                  <pre className="font-mono text-sm text-emerald-300/90 whitespace-pre-wrap leading-relaxed">
                    {output}
                  </pre>
                )}
              </div>
            )}

            {activeTab === 'errors' && (
              <div ref={outputRef} className="h-full overflow-y-auto p-3 scrollbar-thin">
                {!stderr && (
                  <div className="text-white/20 text-sm font-mono">
                    // No errors — you're golden ✨
                  </div>
                )}
                {stderr && (
                  <pre className="font-mono text-sm text-red-400/90 whitespace-pre-wrap leading-relaxed">
                    {stderr}
                  </pre>
                )}
              </div>
            )}

            {activeTab === 'stdin' && (
              <div className="h-full p-3">
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter program input here (stdin)…"
                  className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-sm text-white/70 placeholder:text-white/25 scrollbar-thin"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
