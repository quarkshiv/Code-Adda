import { useCallback } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { runCode } from '@/services/compilerApi';
import { toast } from 'sonner';

export function useCodeExecution() {
  const {
    code, language, stdin,
    setOutput, setStderr,
    setIsRunning,
    setIsOutputPanelOpen,
    setActivePanel: _setActivePanel,
  } = useEditorStore();

  const execute = useCallback(async () => {
    setIsRunning(true);
    setOutput('');
    setStderr('');
    setIsOutputPanelOpen(true);

    try {
      const result = await runCode(code, language.id, stdin);

      const stdout = result.stdout || '';
      const stderr = result.stderr || result.compile_output || result.message || '';

      setOutput(stdout.trim() || (stderr ? '' : 'Program completed with no output.'));
      setStderr(stderr.trim());

      if (stderr.trim()) {
        toast.error(`Execution error: ${result.status?.description || 'Runtime Error'}`);
      } else if (stdout.trim()) {
        toast.success(`Executed in ${result.status?.description || 'Accepted'}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setStderr(`Network or API error: ${errMsg}`);
      toast.error('Failed to execute code. Check your connection.');
    } finally {
      setIsRunning(false);
    }
  }, [code, language.id, stdin]);

  return { execute };
}
