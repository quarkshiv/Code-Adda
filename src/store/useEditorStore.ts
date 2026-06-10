import { create } from 'zustand';

export type Language = {
  id: number;
  name: string;
  monacoLang: string;
  label: string;
  icon: string;
  defaultCode: string;
};

export const LANGUAGES: Language[] = [
  {
    id: 63,
    name: 'javascript',
    monacoLang: 'javascript',
    label: 'JavaScript',
    icon: 'JS',
    defaultCode: `// Welcome to CodeAdda! 🚀
// Start coding and collaborate in real-time

function greet(name) {
  return \`Hello, \${name}! Let's code together.\`;
}

console.log(greet("World"));
`,
  },
  {
    id: 74,
    name: 'typescript',
    monacoLang: 'typescript',
    label: 'TypeScript',
    icon: 'TS',
    defaultCode: `// TypeScript - Type-safe JavaScript
interface Greeter {
  name: string;
  greet(): string;
}

const greeter: Greeter = {
  name: "World",
  greet() {
    return \`Hello, \${this.name}! Let's build something amazing.\`;
  }
};

console.log(greeter.greet());
`,
  },
  {
    id: 71,
    name: 'python',
    monacoLang: 'python',
    label: 'Python',
    icon: 'PY',
    defaultCode: `# Welcome to CodeAdda! 🚀
def greet(name: str) -> str:
    return f"Hello, {name}! Let's code together."

if __name__ == "__main__":
    print(greet("World"))
`,
  },
  {
    id: 62,
    name: 'java',
    monacoLang: 'java',
    label: 'Java',
    icon: 'JV',
    defaultCode: `// Java - Enterprise strength code
public class Main {
    public static String greet(String name) {
        return "Hello, " + name + "! Let's code together.";
    }
    
    public static void main(String[] args) {
        System.out.println(greet("World"));
    }
}
`,
  },
  {
    id: 54,
    name: 'cpp',
    monacoLang: 'cpp',
    label: 'C++',
    icon: 'C++',
    defaultCode: `// C++ - Power and performance
#include <iostream>
#include <string>

std::string greet(const std::string& name) {
    return "Hello, " + name + "! Let's code together.";
}

int main() {
    std::cout << greet("World") << std::endl;
    return 0;
}
`,
  },
  {
    id: 50,
    name: 'c',
    monacoLang: 'c',
    label: 'C',
    icon: 'C',
    defaultCode: `// C - The foundation of computing
#include <stdio.h>

void greet(const char* name) {
    printf("Hello, %s! Let's code together.\\n", name);
}

int main() {
    greet("World");
    return 0;
}
`,
  },
];

export const USER_COLORS = [
  '#3B82F6', // Blue
  '#A855F7', // Purple
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
];

export type UserPresence = {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
  isTyping?: boolean;
  avatar?: string;
};

export type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  content: string;
  timestamp: Date;
};

export type Snapshot = {
  id: string;
  code: string;
  language: number;
  timestamp: Date;
  description: string;
};

export type ActivePanel = 'chat' | 'participants' | 'ai' | 'history' | 'whiteboard' | 'interview';

export type AIMode = 'explain' | 'debug' | 'optimize' | 'comments';

interface EditorState {
  // Code state
  code: string;
  language: Language;
  fontSize: number;
  minimap: boolean;
  wordWrap: boolean;

  // Execution state
  output: string;
  stderr: string;
  stdin: string;
  isRunning: boolean;

  // Collaboration
  users: UserPresence[];
  myUser: UserPresence | null;
  typingUsers: string[];

  // Chat
  messages: ChatMessage[];

  // Version history
  snapshots: Snapshot[];

  // UI state
  activePanel: ActivePanel;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  isInterviewMode: boolean;
  interviewTimeLeft: number;
  isOutputPanelOpen: boolean;

  // AI
  aiMode: AIMode;
  aiResponse: string;
  isAiLoading: boolean;

  // Actions
  setCode: (code: string) => void;
  setLanguage: (lang: Language) => void;
  setFontSize: (size: number) => void;
  setMinimap: (v: boolean) => void;
  setWordWrap: (v: boolean) => void;
  setOutput: (output: string) => void;
  setStderr: (s: string) => void;
  setStdin: (s: string) => void;
  setIsRunning: (v: boolean) => void;
  setUsers: (users: UserPresence[]) => void;
  setMyUser: (user: UserPresence | null) => void;
  addMessage: (msg: ChatMessage) => void;
  addSnapshot: (snap: Snapshot) => void;
  restoreSnapshot: (snap: Snapshot) => void;
  setActivePanel: (panel: ActivePanel) => void;
  setIsLeftSidebarOpen: (v: boolean) => void;
  setIsRightSidebarOpen: (v: boolean) => void;
  setIsInterviewMode: (v: boolean) => void;
  setInterviewTimeLeft: (t: number) => void;
  setIsOutputPanelOpen: (v: boolean) => void;
  setAiMode: (mode: AIMode) => void;
  setAiResponse: (r: string) => void;
  setIsAiLoading: (v: boolean) => void;
  setTypingUsers: (users: string[]) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  code: LANGUAGES[0].defaultCode,
  language: LANGUAGES[0],
  fontSize: 15,
  minimap: true,
  wordWrap: false,

  output: '',
  stderr: '',
  stdin: '',
  isRunning: false,

  users: [],
  myUser: null,
  typingUsers: [],

  messages: [],
  snapshots: [],

  activePanel: 'chat',
  isLeftSidebarOpen: true,
  isRightSidebarOpen: true,
  isInterviewMode: false,
  interviewTimeLeft: 45 * 60,
  isOutputPanelOpen: true,

  aiMode: 'explain',
  aiResponse: '',
  isAiLoading: false,

  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language, code: language.defaultCode }),
  setFontSize: (fontSize) => set({ fontSize }),
  setMinimap: (minimap) => set({ minimap }),
  setWordWrap: (wordWrap) => set({ wordWrap }),
  setOutput: (output) => set({ output }),
  setStderr: (stderr) => set({ stderr }),
  setStdin: (stdin) => set({ stdin }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setUsers: (users) => set({ users }),
  setMyUser: (myUser) => set({ myUser }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  addSnapshot: (snap) => set((s) => ({ snapshots: [snap, ...s.snapshots] })),
  restoreSnapshot: (snap) => set({ code: snap.code, language: LANGUAGES.find(l => l.id === snap.language) || LANGUAGES[0] }),
  setActivePanel: (activePanel) => set({ activePanel }),
  setIsLeftSidebarOpen: (isLeftSidebarOpen) => set({ isLeftSidebarOpen }),
  setIsRightSidebarOpen: (isRightSidebarOpen) => set({ isRightSidebarOpen }),
  setIsInterviewMode: (isInterviewMode) => set({ isInterviewMode }),
  setInterviewTimeLeft: (interviewTimeLeft) => set({ interviewTimeLeft }),
  setIsOutputPanelOpen: (isOutputPanelOpen) => set({ isOutputPanelOpen }),
  setAiMode: (aiMode) => set({ aiMode }),
  setAiResponse: (aiResponse) => set({ aiResponse }),
  setIsAiLoading: (isAiLoading) => set({ isAiLoading }),
  setTypingUsers: (typingUsers) => set({ typingUsers }),
}));
