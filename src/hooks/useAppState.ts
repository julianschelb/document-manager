import { useState, useEffect, useCallback, useRef } from "react";
import { Binder, Document, AppState } from "../types";
import * as cmds from "../lib/tauriCommands";

export function useAppState() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [binders, setBinders] = useState<Binder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to always have current state in callbacks without stale closure issues
  const stateRef = useRef<AppState>({ documents, binders });
  stateRef.current = { documents, binders };

  // Load on mount
  useEffect(() => {
    cmds
      .loadState()
      .then((state) => {
        setDocuments(state.documents);
        setBinders(state.binders);
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  // Persist helper — always uses current state ref
  const persist = useCallback(async (docs: Document[], binds: Binder[]) => {
    await cmds.saveState({ documents: docs, binders: binds });
  }, []);

  // --- Document mutations ---

  const importDoc = useCallback(
    async (sourcePath: string): Promise<Document> => {
      const doc = await cmds.importDocument(sourcePath);
      const newDocs = [...stateRef.current.documents, doc];
      setDocuments(newDocs);
      await persist(newDocs, stateRef.current.binders);
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
      await persist(newDocs, stateRef.current.binders);
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
      await persist(newDocs, stateRef.current.binders);
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
      await persist(stateRef.current.documents, newBinders);
    },
    [persist]
  );

  const updateBinder = useCallback(
    async (binderId: string, updates: Partial<Omit<Binder, "id">>) => {
      const newBinders = stateRef.current.binders.map((b) =>
        b.id === binderId ? { ...b, ...updates } : b
      );
      setBinders(newBinders);
      await persist(stateRef.current.documents, newBinders);
    },
    [persist]
  );

  const deleteBinder = useCallback(
    async (binderId: string) => {
      const newBinders = stateRef.current.binders.filter(
        (b) => b.id !== binderId
      );
      setBinders(newBinders);
      await persist(stateRef.current.documents, newBinders);
    },
    [persist]
  );

  return {
    documents,
    binders,
    loading,
    error,
    importDoc,
    deleteDoc,
    updateDoc,
    openDoc,
    addBinder,
    updateBinder,
    deleteBinder,
  };
}
