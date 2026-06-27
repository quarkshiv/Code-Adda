import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';

import { useEditorStore, LANGUAGES } from '@/store/useEditorStore';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useCodeExecution } from '@/hooks/useCodeExecution';
import { useVersionHistory } from '@/hooks/useVersionHistory';
import {
  apiGetRoom, apiGetChatHistory, apiGetSnapshots,
  apiCheckHealth, apiHeartbeat, apiGetActiveUsers, apiLeavePresence,
} from '@/services/mongoApi';

import { EditorNavbar } from '@/components/editor/EditorNavbar';
import { LeftSidebar } from '@/components/editor/LeftSidebar';
import { RightSidebar } from '@/components/editor/RightSidebar';
import { OutputConsole } from '@/components/editor/OutputConsole';
import { InterviewPanel } from '@/components/editor/InterviewPanel';

const EditorPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const safeRoomId = roomId || 'default-room';

  const {
    code, setCode, setLanguage,
    language, fontSize, minimap, wordWrap,
    isRightSidebarOpen, setIsRightSidebarOpen,
    addMessage, addSnapshot, myUser, setUsers,
  } = useEditorStore();

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  // Hooks
  const { broadcastCode, sendChatMessage, sendTypingIndicator } = useCollaboration(safeRoomId, editorRef);
  const { execute } = useCodeExecution();
  const { createSnapshot } = useVersionHistory(safeRoomId);

  // ── Load from MongoDB on mount ─────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const initRoom = async () => {
      // 1. Check backend health
      const healthy = await apiCheckHealth();
      if (isMounted) setIsBackendOnline(healthy);

      if (!healthy) return; // graceful degradation

      // 2. Load room code + language from MongoDB
      const room = await apiGetRoom(safeRoomId);
      if (room && isMounted && room.code) {
        setCode(room.code);
        const lang = LANGUAGES.find((l) => l.id === room.language);
        if (lang) setLanguage(lang);
      }

      // 3. Load chat history
      const chatHistory = await apiGetChatHistory(safeRoomId);
      if (isMounted) {
        chatHistory.forEach((msg) =>
          addMessage({
            id: msg._id,
            userId: msg.userId,
            userName: msg.userName,
            userColor: msg.userColor,
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          })
        );
      }

      // 4. Load snapshots
      const snaps = await apiGetSnapshots(safeRoomId);
      if (isMounted) {
        snaps.forEach((s) =>
          addSnapshot({
            id: s._id,
            code: s.code,
            language: s.language,
            description: s.description,
            timestamp: new Date(s.createdAt),
          })
        );
      }
    };

    initRoom();

    // ── Poll for new chat messages every 3s (fallback for Supabase Realtime) ──
    const pollChat = setInterval(async () => {
      if (!isMounted) return;
      try {
        const msgs = await apiGetChatHistory(safeRoomId);
        msgs.forEach((msg) =>
          addMessage({
            id: msg._id,
            userId: msg.userId,
            userName: msg.userName,
            userColor: msg.userColor,
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          })
        );
      } catch {
        // silent — don't break the editor if backend is down
      }
    }, 3000);

    // ── Server-side presence: heartbeat + poll ──
    // Send heartbeat immediately, then every 5s
    const sendHeartbeat = () => {
      const u = useEditorStore.getState().myUser;
      if (u) {
        apiHeartbeat(safeRoomId, {
          userId: u.id,
          userName: u.name,
          userColor: u.color,
          avatar: u.avatar,
        });
      }
    };
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 5000);

    // Poll active users every 3s
    const pollPresence = setInterval(async () => {
      if (!isMounted) return;
      try {
        const users = await apiGetActiveUsers(safeRoomId);
        setUsers(users.map((u) => ({
          id: u.id,
          name: u.name,
          color: u.color,
          avatar: u.avatar,
        })));
      } catch {
        // silent
      }
    }, 3000);

    // Notify server when tab closes
    const handleUnload = () => {
      const u = useEditorStore.getState().myUser;
      if (u) {
        // sendBeacon is fire-and-forget, works during unload
        navigator.sendBeacon(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/rooms/${safeRoomId}/presence`,
          new Blob([JSON.stringify({ userId: u.id, _method: 'DELETE' })], { type: 'application/json' })
        );
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      isMounted = false;
      clearInterval(pollChat);
      clearInterval(heartbeatInterval);
      clearInterval(pollPresence);
      window.removeEventListener('beforeunload', handleUnload);
      // Actively leave on cleanup
      const u = useEditorStore.getState().myUser;
      if (u) apiLeavePresence(safeRoomId, u.id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeRoomId]);

  // Monaco mount handler
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom theme
    monaco.editor.defineTheme('pcp-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc' },
        { token: 'string', foreground: '86efac' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: '67e8f9' },
        { token: 'function', foreground: '93c5fd' },
        { token: 'variable', foreground: 'e2e8f0' },
        { token: 'operator', foreground: 'f0abfc' },
      ],
      colors: {
        'editor.background': '#080810',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#ffffff08',
        'editor.selectionBackground': '#7c3aed40',
        'editor.inactiveSelectionBackground': '#7c3aed20',
        'editorLineNumber.foreground': '#ffffff20',
        'editorLineNumber.activeForeground': '#a855f7',
        'editorCursor.foreground': '#a855f7',
        'editorIndentGuide.background': '#ffffff08',
        'editorIndentGuide.activeBackground': '#7c3aed40',
        'editor.findMatchBackground': '#7c3aed50',
        'editor.findMatchHighlightBackground': '#7c3aed25',
        'editorSuggestWidget.background': '#0d0d1a',
        'editorSuggestWidget.border': '#ffffff15',
        'editorSuggestWidget.selectedBackground': '#7c3aed30',
        'editorWidget.background': '#0d0d1a',
        'editorWidget.border': '#ffffff15',
        'scrollbarSlider.background': '#ffffff10',
        'scrollbarSlider.hoverBackground': '#ffffff20',
        'scrollbarSlider.activeBackground': '#7c3aed40',
        'minimap.background': '#060609',
        'editorGutter.background': '#080810',
      },
    });

    monaco.editor.setTheme('pcp-dark');

    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      createSnapshot();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      execute();
    });

    // Focus the editor
    editor.focus();
  };

  // Code change handler
  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const newCode = value ?? '';
      setCode(newCode);
      broadcastCode(newCode);
      sendTypingIndicator(true);
    },
    [setCode, broadcastCode, sendTypingIndicator]
  );

  // Keyboard shortcut: toggle right sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        setIsRightSidebarOpen(!isRightSidebarOpen);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isRightSidebarOpen, setIsRightSidebarOpen]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#080810] overflow-hidden">
      {/* Navbar */}
      <EditorNavbar
        roomId={safeRoomId}
        onRun={execute}
        onSave={() => createSnapshot()}
        isConnected={isBackendOnline}
      />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <LeftSidebar />

        {/* Center: Editor + bottom console */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Interview panel (conditionally shown) */}
          <InterviewPanel />

          {/* Monaco Editor */}
          <motion.div
            className="flex-1 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <MonacoEditor
              height="100%"
              language={language.monacoLang}
              defaultValue={code}
              onChange={handleCodeChange}
              onMount={handleEditorMount}
              options={{
                fontSize,
                fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", "Roboto Mono", monospace',
                fontLigatures: true,
                minimap: { enabled: minimap },
                wordWrap: wordWrap ? 'on' : 'off',
                lineNumbers: 'on',
                renderLineHighlight: 'gutter',
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                smoothScrolling: true,
                cursorBlinking: 'phase',
                cursorSmoothCaretAnimation: 'on',
                bracketPairColorization: { enabled: true },
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                  showWords: true,
                  preview: true,
                },
                inlineSuggest: { enabled: true },
                tabSize: 2,
                insertSpaces: true,
                formatOnPaste: true,
                formatOnType: true,
                autoIndent: 'advanced',
                quickSuggestions: { other: true, comments: false, strings: false },
                parameterHints: { enabled: true },
                contextmenu: true,
                mouseWheelZoom: true,
                occurrencesHighlight: 'singleFile',
                selectionHighlight: true,
                codeLens: false,
                folding: true,
                foldingHighlight: true,
                showFoldingControls: 'mouseover',
                renderWhitespace: 'selection',
                guides: {
                  indentation: true,
                  bracketPairs: true,
                },
                stickyScroll: { enabled: true },
                glyphMargin: false,
              }}
            />
          </motion.div>

          {/* Output console */}
          <OutputConsole />
        </div>

        {/* Right sidebar */}
        <RightSidebar onSendMessage={sendChatMessage} />
      </div>
    </div>
  );
};

export default EditorPage;
