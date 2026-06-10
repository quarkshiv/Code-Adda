import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer, RotateCcw, Square, Play, Pause,
  BookOpen, Lightbulb, CheckSquare, ChevronRight,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { cn } from '@/lib/utils';

const INTERVIEW_QUESTIONS = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Map'],
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]' },
      { input: 'nums = [3,2,4], target = 6', output: '[1, 2]' },
    ],
    hint: 'Use a hash map to store complement values.',
  },
  {
    id: 2,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['Stack', 'String'],
    description:
      'Given a string `s` containing just `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.',
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    hint: 'Use a stack and push/pop matching brackets.',
  },
  {
    id: 3,
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'],
    description:
      'Given the head of a singly linked list, reverse the list and return the reversed list.',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' },
    ],
    hint: 'Use three pointers: prev, curr, next.',
  },
  {
    id: 4,
    title: 'Binary Search',
    difficulty: 'Easy',
    tags: ['Array', 'Binary Search'],
    description:
      'Given a sorted array of integers `nums` and a target, return the index if found. Otherwise return -1.',
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' },
    ],
    hint: 'Use two pointers: left and right. Check mid each time.',
  },
  {
    id: 5,
    title: 'Merge Intervals',
    difficulty: 'Medium',
    tags: ['Array', 'Sorting'],
    description:
      'Given an array of intervals, merge all overlapping intervals and return an array of non-overlapping intervals.',
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]' },
    ],
    hint: 'Sort by start time, then iterate and merge overlapping.',
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Hard: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export const InterviewPanel: React.FC = () => {
  const {
    isInterviewMode,
    interviewTimeLeft, setInterviewTimeLeft,
  } = useEditorStore();

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(INTERVIEW_QUESTIONS[0]);
  const [showHint, setShowHint] = useState(false);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimerRunning && interviewTimeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setInterviewTimeLeft(interviewTimeLeft - 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isTimerRunning, interviewTimeLeft, setInterviewTimeLeft]);

  const resetTimer = () => {
    setIsTimerRunning(false);
    setInterviewTimeLeft(45 * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const pct = (interviewTimeLeft / (45 * 60)) * 100;
  const circumference = 2 * Math.PI * 20;

  return (
    <AnimatePresence>
      {isInterviewMode && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="border-b border-amber-500/20 bg-gradient-to-r from-amber-900/10 to-orange-900/10 overflow-hidden flex-shrink-0"
        >
          <div className="flex items-stretch h-full">
            {/* Timer section */}
            <div className="p-4 flex flex-col items-center justify-center gap-2 border-r border-amber-500/10 min-w-[120px]">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="20" fill="none" stroke="#ffffff10" strokeWidth="2" />
                  <circle
                    cx="22" cy="22" r="20"
                    fill="none"
                    stroke={interviewTimeLeft < 300 ? '#EF4444' : '#F59E0B'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (pct / 100) * circumference}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Timer className={cn('w-4 h-4', interviewTimeLeft < 300 ? 'text-red-400' : 'text-amber-400')} />
                </div>
              </div>
              <span className={cn('font-mono text-lg font-bold', interviewTimeLeft < 300 ? 'text-red-400' : 'text-amber-300')}>
                {formatTime(interviewTimeLeft)}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="p-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all"
                >
                  {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <button
                  onClick={resetTimer}
                  className="p-1 rounded bg-white/5 text-white/40 hover:bg-white/10 transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Question section */}
            <div className="flex-1 p-4 overflow-y-auto max-h-64 scrollbar-thin">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white/90">{selectedQuestion.title}</h3>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-semibold', DIFFICULTY_COLORS[selectedQuestion.difficulty])}>
                      {selectedQuestion.difficulty}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap mb-2">
                    {selectedQuestion.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setShowQuestionList(!showQuestionList)}
                  className="text-[10px] text-amber-400/70 hover:text-amber-300 flex items-center gap-0.5 whitespace-nowrap"
                >
                  <BookOpen className="w-3 h-3" />
                  Switch
                </button>
              </div>

              <p className="text-xs text-white/60 leading-relaxed mb-3">{selectedQuestion.description}</p>

              {selectedQuestion.examples.map((ex, i) => (
                <div key={i} className="mb-2 bg-black/20 rounded-lg p-2">
                  <div className="text-[10px] text-white/40 mb-1">Example {i + 1}:</div>
                  <div className="font-mono text-[11px] text-white/60">
                    <div><span className="text-blue-400">Input:</span> {ex.input}</div>
                    <div><span className="text-emerald-400">Output:</span> {ex.output}</div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1.5 text-[11px] text-amber-400/60 hover:text-amber-300 transition-colors"
              >
                <Lightbulb className="w-3 h-3" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-amber-300/70 mt-1 bg-amber-500/5 rounded px-2 py-1 border border-amber-500/10"
                >
                  💡 {selectedQuestion.hint}
                </motion.p>
              )}
            </div>
          </div>

          {/* Question list dropdown */}
          <AnimatePresence>
            {showQuestionList && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-amber-500/10"
              >
                <div className="p-2 grid grid-cols-1 gap-1 max-h-40 overflow-y-auto scrollbar-thin">
                  {INTERVIEW_QUESTIONS.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => { setSelectedQuestion(q); setShowQuestionList(false); setShowHint(false); }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-all',
                        selectedQuestion.id === q.id ? 'bg-amber-500/20 text-amber-200' : 'hover:bg-white/5 text-white/50'
                      )}
                    >
                      <CheckSquare className="w-3 h-3 flex-shrink-0" />
                      <span className="flex-1 truncate font-medium">{q.title}</span>
                      <span className={cn('text-[10px] font-semibold', DIFFICULTY_COLORS[q.difficulty].split(' ')[0])}>
                        {q.difficulty}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
