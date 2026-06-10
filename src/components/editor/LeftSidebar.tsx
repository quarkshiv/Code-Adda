import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Settings, ChevronRight,
  Type, Minus, Plus, Eye, EyeOff,
  Keyboard, Palette, Monitor,
} from 'lucide-react';
import { useEditorStore, LANGUAGES } from '@/store/useEditorStore';
import { cn } from '@/lib/utils';

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 22, 24];

export const LeftSidebar: React.FC = () => {
  const {
    isLeftSidebarOpen,
    language, setLanguage,
    fontSize, setFontSize,
    minimap, setMinimap,
    wordWrap, setWordWrap,
    isInterviewMode, setIsInterviewMode,
  } = useEditorStore();

  const [activeSection, setActiveSection] = React.useState<string | null>('language');

  const LANG_COLORS: Record<string, string> = {
    JS: '#F7DF1E', TS: '#3178C6', PY: '#4B8BBE',
    JV: '#E76F00', 'C++': '#00599C', C: '#A8B9CC',
  };

  return (
    <AnimatePresence>
      {isLeftSidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 220, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex-shrink-0 h-full bg-[#0D0D1A]/60 border-r border-white/8 overflow-hidden flex flex-col backdrop-blur-lg"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-2 text-white/60 text-xs font-semibold uppercase tracking-widest">
              <Code2 className="w-3.5 h-3.5" />
              Explorer
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
            {/* Language Selection */}
            <SidebarSection
              icon={<Palette className="w-3.5 h-3.5" />}
              label="Language"
              isOpen={activeSection === 'language'}
              onToggle={() => setActiveSection(activeSection === 'language' ? null : 'language')}
            >
              <div className="space-y-0.5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all group',
                      language.id === lang.id
                        ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                        : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                    )}
                  >
                    <span
                      className="font-mono font-bold text-[11px] w-6 text-center"
                      style={{ color: LANG_COLORS[lang.icon] }}
                    >
                      {lang.icon}
                    </span>
                    {lang.label}
                    {language.id === lang.id && (
                      <ChevronRight className="w-3 h-3 ml-auto text-purple-400" />
                    )}
                  </button>
                ))}
              </div>
            </SidebarSection>

            {/* Editor Settings */}
            <SidebarSection
              icon={<Settings className="w-3.5 h-3.5" />}
              label="Editor"
              isOpen={activeSection === 'editor'}
              onToggle={() => setActiveSection(activeSection === 'editor' ? null : 'editor')}
            >
              <div className="space-y-3 px-1">
                {/* Font size */}
                <div>
                  <label className="text-[11px] text-white/40 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-2">
                    <Type className="w-3 h-3" />
                    Font Size
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                      className="w-6 h-6 rounded flex items-center justify-center bg-white/8 hover:bg-white/15 text-white/60 hover:text-white transition-all"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="flex-1 text-center text-white text-sm font-mono font-semibold">
                      {fontSize}px
                    </span>
                    <button
                      onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                      className="w-6 h-6 rounded flex items-center justify-center bg-white/8 hover:bg-white/15 text-white/60 hover:text-white transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Minimap */}
                <ToggleSetting
                  icon={<Monitor className="w-3 h-3" />}
                  label="Minimap"
                  value={minimap}
                  onChange={setMinimap}
                />

                {/* Word wrap */}
                <ToggleSetting
                  icon={<Keyboard className="w-3 h-3" />}
                  label="Word Wrap"
                  value={wordWrap}
                  onChange={setWordWrap}
                />
              </div>
            </SidebarSection>

            {/* Interview Mode */}
            <SidebarSection
              icon={<span className="text-[12px]">🏆</span>}
              label="Interview"
              isOpen={activeSection === 'interview'}
              onToggle={() => setActiveSection(activeSection === 'interview' ? null : 'interview')}
            >
              <div className="px-1 space-y-2">
                <p className="text-xs text-white/40 leading-relaxed">
                  Start a timed interview session with a built-in question panel and countdown timer.
                </p>
                <button
                  onClick={() => setIsInterviewMode(!isInterviewMode)}
                  className={cn(
                    'w-full py-2 px-3 rounded-lg text-sm font-semibold transition-all',
                    isInterviewMode
                      ? 'bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30'
                      : 'bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30'
                  )}
                >
                  {isInterviewMode ? '⏹ End Session' : '▶ Start Session'}
                </button>
              </div>
            </SidebarSection>
          </div>

          {/* Bottom: version info */}
          <div className="px-4 py-3 border-t border-white/8 text-[10px] text-white/20">
            CodeAdda v2.0
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

interface SidebarSectionProps {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ icon, label, isOpen, onToggle, children }) => (
  <div className="mb-1">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white/50 hover:text-white/80 uppercase tracking-widest transition-colors group"
    >
      <span className="text-white/30 group-hover:text-white/60 transition-colors">{icon}</span>
      {label}
      <ChevronRight
        className={cn('w-3 h-3 ml-auto text-white/20 transition-transform', isOpen && 'rotate-90')}
      />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden px-2 pb-2"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface ToggleSettingProps {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({ icon, label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <label className="text-xs text-white/50 flex items-center gap-1.5">
      {icon}
      {label}
    </label>
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'w-9 h-5 rounded-full transition-all relative',
        value ? 'bg-purple-500' : 'bg-white/15'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
          value ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </button>
  </div>
);
