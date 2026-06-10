import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore, type Snapshot } from '@/store/useEditorStore';
import { apiSaveSnapshot } from '@/services/mongoApi';
import { toast } from 'sonner';

export function useVersionHistory(roomId: string) {
  const { code, language, addSnapshot, snapshots, myUser } = useEditorStore();

  const createSnapshot = useCallback(
    async (description?: string) => {
      const desc =
        description ||
        `Snapshot at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${code.split('\n').length} lines`;

      const localId = uuidv4();
      const snap: Snapshot = {
        id: localId,
        code,
        language: language.id,
        timestamp: new Date(),
        description: desc,
      };

      // Add to Zustand immediately (optimistic update)
      addSnapshot(snap);
      toast.success('💾 Snapshot saved!');

      // Persist to MongoDB in background
      apiSaveSnapshot(roomId, code, language.id, desc, myUser?.id).then((saved) => {
        if (saved) {
          // Update the local snapshot ID to match MongoDB's _id (optional)
          console.log('[MongoDB] Snapshot persisted:', saved._id);
        }
      });

      // Also save to localStorage as offline backup
      try {
        const stored = JSON.parse(
          localStorage.getItem(`pcp_snapshots_${roomId}`) || '[]'
        );
        stored.unshift({ ...snap, timestamp: snap.timestamp.toISOString() });
        localStorage.setItem(
          `pcp_snapshots_${roomId}`,
          JSON.stringify(stored.slice(0, 30))
        );
      } catch {
        // ignore localStorage errors
      }
    },
    [code, language.id, addSnapshot, roomId, myUser?.id]
  );

  const loadLocalSnapshots = useCallback(() => {
    try {
      const stored: (Omit<Snapshot, 'timestamp'> & { timestamp: string })[] = JSON.parse(
        localStorage.getItem(`pcp_snapshots_${roomId}`) || '[]'
      );
      return stored.map((s) => ({ ...s, timestamp: new Date(s.timestamp) }));
    } catch {
      return [];
    }
  }, [roomId]);

  return { createSnapshot, loadLocalSnapshots, snapshots };
}
