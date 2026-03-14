import { useState, useEffect, useCallback, useRef } from "react";
import { Binder, Document, AppState } from "../types";
import * as cmds from "../lib/tauriCommands";

export function useAppState() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [binders, setBinders] = useState<Binder[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [openAiApiKey, setOpenAiApiKey] = useState<string>("");
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref always reflects the latest state; mutations update it before persisting
  const stateRef = useRef<AppState>({
    documents,
    binders,
    customTags,
    openAiApiKey,
    aiEnabled,
  });
  stateRef.current = { documents, binders, customTags, openAiApiKey, aiEnabled };

  // Load on mount
  useEffect(() => {
    cmds
      .loadState()
      .then((state) => {
        setDocuments(state.documents);
        setBinders(state.binders);
        setCustomTags(state.customTags ?? []);
        setOpenAiApiKey(state.openAiApiKey ?? "");
        setAiEnabled(state.aiEnabled ?? true);
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  // Persist reads everything from stateRef (always current after mutations)
  const persist = useCallback(async () => {
    const s = stateRef.current;
    await cmds.saveState({
      documents: s.documents,
      binders: s.binders,
      customTags: s.customTags,
      openAiApiKey: s.openAiApiKey,
      aiEnabled: s.aiEnabled,
    });
  }, []);

  // Shared AI enrichment — fire-and-forget
  const triggerAiEnrichment = useCallback(
    (docId: string, filePath: string, fileType: string, content: string) => {
      const allTags = [
        ...new Set([
          ...stateRef.current.documents.flatMap((d) => d.tags),
          ...stateRef.current.customTags,
        ]),
      ];
      setAnalyzingIds((prev) => new Set([...prev, docId]));
      cmds
        .analyzeDocumentWithAi(filePath, fileType, content, allTags)
        .then((analysis) => {
          const enriched = stateRef.current.documents.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  title: analysis.title,
                  tags: analysis.tags,
                  summary: analysis.summary,
                  ...(analysis.correspondenceDate ? { correspondenceDate: analysis.correspondenceDate } : {}),
                }
              : d
          );
          stateRef.current = { ...stateRef.current, documents: enriched };
          setDocuments(enriched);
          persist();
        })
        .catch((err) => console.warn("AI enrichment failed:", err))
        .finally(() =>
          setAnalyzingIds((prev) => {
            const next = new Set(prev);
            next.delete(docId);
            return next;
          })
        );
    },
    [persist]
  );

  // --- Document mutations ---

  const importDoc = useCallback(
    async (sourcePath: string): Promise<Document> => {
      const doc = await cmds.importDocument(sourcePath);
      const newDocs = [...stateRef.current.documents, doc];
      stateRef.current = { ...stateRef.current, documents: newDocs };
      setDocuments(newDocs);
      await persist();

      if (stateRef.current.openAiApiKey && stateRef.current.aiEnabled) {
        triggerAiEnrichment(doc.id, doc.filePath, doc.fileType, doc.content ?? "");
      }

      return doc;
    },
    [persist, triggerAiEnrichment]
  );

  const deleteDoc = useCallback(
    async (docId: string) => {
      const doc = stateRef.current.documents.find((d) => d.id === docId);
      if (!doc) return;
      await cmds.deleteDocumentFiles(doc.filePath, doc.thumbnailPath);
      const newDocs = stateRef.current.documents.filter((d) => d.id !== docId);
      stateRef.current = { ...stateRef.current, documents: newDocs };
      setDocuments(newDocs);
      await persist();
    },
    [persist]
  );

  const updateDoc = useCallback(
    async (docId: string, updates: Partial<Pick<Document, "title" | "tags" | "correspondenceDate">>) => {
      const newDocs = stateRef.current.documents.map((d) =>
        d.id === docId ? { ...d, ...updates } : d
      );
      stateRef.current = { ...stateRef.current, documents: newDocs };
      setDocuments(newDocs);
      await persist();
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
      stateRef.current = { ...stateRef.current, binders: newBinders };
      setBinders(newBinders);
      await persist();
    },
    [persist]
  );

  const updateBinder = useCallback(
    async (binderId: string, updates: Partial<Omit<Binder, "id">>) => {
      const newBinders = stateRef.current.binders.map((b) =>
        b.id === binderId ? { ...b, ...updates } : b
      );
      stateRef.current = { ...stateRef.current, binders: newBinders };
      setBinders(newBinders);
      await persist();
    },
    [persist]
  );

  const deleteBinder = useCallback(
    async (binderId: string) => {
      const newBinders = stateRef.current.binders.filter((b) => b.id !== binderId);
      stateRef.current = { ...stateRef.current, binders: newBinders };
      setBinders(newBinders);
      await persist();
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

      stateRef.current = {
        ...stateRef.current,
        documents: newDocs,
        binders: newBinders,
        customTags: newCustomTags,
      };
      setDocuments(newDocs);
      setBinders(newBinders);
      setCustomTags(newCustomTags);
      await persist();
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

      stateRef.current = {
        ...stateRef.current,
        documents: newDocs,
        binders: newBinders,
        customTags: newCustomTags,
      };
      setDocuments(newDocs);
      setBinders(newBinders);
      setCustomTags(newCustomTags);
      await persist();
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
      stateRef.current = { ...stateRef.current, customTags: newCustomTags };
      setCustomTags(newCustomTags);
      await persist();
    },
    [persist]
  );

  // --- AI settings ---

  const updateApiKey = useCallback(
    async (key: string) => {
      stateRef.current = { ...stateRef.current, openAiApiKey: key };
      setOpenAiApiKey(key);
      await persist();
    },
    [persist]
  );

  const updateAiEnabled = useCallback(
    async (enabled: boolean) => {
      stateRef.current = { ...stateRef.current, aiEnabled: enabled };
      setAiEnabled(enabled);
      await persist();
    },
    [persist]
  );

  const reanalyzeDoc = useCallback(
    (docId: string) => {
      const doc = stateRef.current.documents.find((d) => d.id === docId);
      if (!doc || !stateRef.current.openAiApiKey) return;
      triggerAiEnrichment(doc.id, doc.filePath, doc.fileType, doc.content ?? "");
    },
    [triggerAiEnrichment]
  );

  return {
    documents,
    binders,
    customTags,
    openAiApiKey,
    aiEnabled,
    analyzingIds,
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
    updateApiKey,
    updateAiEnabled,
    reanalyzeDoc,
  };
}
