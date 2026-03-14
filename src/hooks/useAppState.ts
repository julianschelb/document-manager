import { useState, useEffect, useCallback, useRef } from "react";
import { Binder, Document, AppState } from "../types";
import * as cmds from "../lib/tauriCommands";

export function useAppState() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [binders, setBinders] = useState<Binder[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to always have current state in callbacks without stale closure issues
  const stateRef = useRef<AppState>({ documents, binders, customTags });
  stateRef.current = { documents, binders, customTags };

  // Load on mount
  useEffect(() => {
    cmds
      .loadState()
      .then((state) => {
        setDocuments(state.documents);
        setBinders(state.binders);
        setCustomTags(state.customTags ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  // Persist helper — always uses current state ref
  const persist = useCallback(
    async (docs: Document[], binds: Binder[], tags: string[]) => {
      await cmds.saveState({ documents: docs, binders: binds, customTags: tags });
    },
    []
  );

  // --- Document mutations ---

  const importDoc = useCallback(
    async (sourcePath: string): Promise<Document> => {
      const doc = await cmds.importDocument(sourcePath);
      const newDocs = [...stateRef.current.documents, doc];
      setDocuments(newDocs);
      await persist(newDocs, stateRef.current.binders, stateRef.current.customTags);
      return doc;
    },
    [persist]
  );

  const deleteDoc = useCallback(
    async (docId: string) => {
      const doc = stateRef.current.documents.find((d) => d.id === docId);
      if (!doc) return;
      await cmds.deleteDocumentFiles(doc.filePath, doc.thumbnailPath);
      const newDocs = stateRef.current.documents.filter((d) => d.id !== docId);
      setDocuments(newDocs);
      await persist(newDocs, stateRef.current.binders, stateRef.current.customTags);
    },
    [persist]
  );

  const updateDoc = useCallback(
    async (
      docId: string,
      updates: Partial<Pick<Document, "title" | "tags">>
    ) => {
      const newDocs = stateRef.current.documents.map((d) =>
        d.id === docId ? { ...d, ...updates } : d
      );
      setDocuments(newDocs);
      await persist(newDocs, stateRef.current.binders, stateRef.current.customTags);
    },
    [persist]
  );

  const openDoc = useCallback(async (filePath: string) => {
    await cmds.openDocument(filePath);
  }, []);

  // --- Binder mutations ---

  const addBinder = useCallback(
    async (binder: Binder) => {
      const newBinders = [...stateRef.current.binders, binder];
      setBinders(newBinders);
      await persist(stateRef.current.documents, newBinders, stateRef.current.customTags);
    },
    [persist]
  );

  const updateBinder = useCallback(
    async (binderId: string, updates: Partial<Omit<Binder, "id">>) => {
      const newBinders = stateRef.current.binders.map((b) =>
        b.id === binderId ? { ...b, ...updates } : b
      );
      setBinders(newBinders);
      await persist(stateRef.current.documents, newBinders, stateRef.current.customTags);
    },
    [persist]
  );

  const deleteBinder = useCallback(
    async (binderId: string) => {
      const newBinders = stateRef.current.binders.filter(
        (b) => b.id !== binderId
      );
      setBinders(newBinders);
      await persist(stateRef.current.documents, newBinders, stateRef.current.customTags);
    },
    [persist]
  );

  // --- Tag mutations ---

  const renameTagEverywhere = useCallback(
    async (oldTag: string, newTag: string) => {
      const trimmed = newTag.trim();
      if (!trimmed || trimmed === oldTag) return;

      const newDocs = stateRef.current.documents.map((d) => ({
        ...d,
        tags: d.tags.map((t) => (t === oldTag ? trimmed : t)),
      }));
      const newBinders = stateRef.current.binders.map((b) => ({
        ...b,
        filterTags: b.filterTags.map((t) => (t === oldTag ? trimmed : t)),
      }));
      const newCustomTags = stateRef.current.customTags.map((t) =>
        t === oldTag ? trimmed : t
      );

      setDocuments(newDocs);
      setBinders(newBinders);
      setCustomTags(newCustomTags);
      await persist(newDocs, newBinders, newCustomTags);
    },
    [persist]
  );

  const removeTagEverywhere = useCallback(
    async (tag: string) => {
      const newDocs = stateRef.current.documents.map((d) => ({
        ...d,
        tags: d.tags.filter((t) => t !== tag),
      }));
      const newBinders = stateRef.current.binders.map((b) => ({
        ...b,
        filterTags: b.filterTags.filter((t) => t !== tag),
      }));
      const newCustomTags = stateRef.current.customTags.filter((t) => t !== tag);

      setDocuments(newDocs);
      setBinders(newBinders);
      setCustomTags(newCustomTags);
      await persist(newDocs, newBinders, newCustomTags);
    },
    [persist]
  );

  const addCustomTag = useCallback(
    async (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      const allExisting = [
        ...stateRef.current.customTags,
        ...stateRef.current.documents.flatMap((d) => d.tags),
      ];
      if (allExisting.includes(trimmed)) return;
      const newCustomTags = [...stateRef.current.customTags, trimmed];
      setCustomTags(newCustomTags);
      await persist(stateRef.current.documents, stateRef.current.binders, newCustomTags);
    },
    [persist]
  );

  return {
    documents,
    binders,
    customTags,
    loading,
    error,
    importDoc,
    deleteDoc,
    updateDoc,
    openDoc,
    addBinder,
    updateBinder,
    deleteBinder,
    renameTagEverywhere,
    removeTagEverywhere,
    addCustomTag,
  };
}
