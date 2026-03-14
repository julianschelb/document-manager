import { useState, useMemo, useCallback, useEffect } from "react";
import { Binder, Document, SortConfig } from "./types";
import { Navbar } from "./components/Navbar";
import { BinderList } from "./components/BinderList";
import { DocumentCard } from "./components/DocumentCard";
import { PreviewPane } from "./components/PreviewPane";
import { ConfirmModal } from "./components/ConfirmModal";
import { EditDocumentModal } from "./components/EditDocumentModal";
import { BinderModal } from "./components/BinderModal";
import { BulkActionBar } from "./components/BulkActionBar";
import { SortControls } from "./components/SortControls";
import { SettingsModal } from "./components/SettingsModal";
import { useAppState } from "./hooks/useAppState";
import { getAllTags, getBinderDocuments } from "./utils/binderUtils";
import "./styles.css";

function App() {
  const {
    documents,
    binders,
    customTags,
    loading,
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
  } = useAppState();

  const [selectedBinder, setSelectedBinder] = useState<Binder | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "dateAdded",
    direction: "desc",
  });
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  // Modal state
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "document" | "binder";
    id: string;
    title: string;
  } | null>(null);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [editingBinder, setEditingBinder] = useState<Binder | "new" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const allTags = useMemo(() => getAllTags(documents), [documents]);

  const filteredDocuments = useMemo(() => {
    const docs = selectedBinder
      ? getBinderDocuments(selectedBinder, documents)
      : documents;

    return docs.filter((doc) => {
      const matchesSearch =
        searchQuery === "" ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => doc.tags.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [searchQuery, selectedTags, selectedBinder, documents]);

  const sortedDocuments = useMemo(() => {
    return [...filteredDocuments].sort((a, b) => {
      let cmp = 0;
      switch (sortConfig.field) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "dateAdded":
          cmp = a.dateAdded.localeCompare(b.dateAdded);
          break;
        case "fileSizeKb":
          cmp = a.fileSizeKb - b.fileSizeKb;
          break;
        case "fileType":
          cmp = a.fileType.localeCompare(b.fileType);
          break;
      }
      return sortConfig.direction === "asc" ? cmp : -cmp;
    });
  }, [filteredDocuments, sortConfig]);

  // --- Handlers ---

  const handleBinderSelect = (binder: Binder | null) => {
    setSelectedBinder(binder);
    setSelectedDocument(null);
  };

  const handleDocumentSelect = (doc: Document) => {
    setSelectedDocument(doc);
    setSelectedDocIds(new Set());
  };

  const handleMultiSelect = (docId: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
    setSelectedDocument(null);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleTagClick = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
  };

  // Import files via native file picker
  const handleImport = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Documents",
            extensions: ["pdf", "docx", "xlsx", "jpg", "jpeg", "png", "txt"],
          },
        ],
      });
      if (!selected) return;
      const paths = Array.isArray(selected) ? selected : [selected];
      for (const path of paths) {
        try {
          await importDoc(path);
        } catch (err) {
          const msg = String(err);
          if (!msg.includes("DUPLICATE:")) {
            console.error("Import failed:", msg);
          }
        }
      }
    } catch (err) {
      console.error("Failed to open file picker:", err);
    }
  }, [importDoc]);

  // Drag and drop from Finder
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    import("@tauri-apps/api/event").then(({ listen }) => {
      listen<{ paths: string[] }>("tauri://drag-drop", async (event) => {
        for (const path of event.payload.paths) {
          try {
            await importDoc(path);
          } catch (err) {
            const msg = String(err);
            if (!msg.includes("DUPLICATE:")) {
              console.error("Drag-drop import failed:", msg);
            }
          }
        }
      }).then((fn) => {
        unlisten = fn;
      });
    });
    return () => {
      unlisten?.();
    };
  }, [importDoc]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (confirmDelete || editingDoc || editingBinder || settingsOpen) return;
        setSelectedDocument(null);
        setSelectedDocIds(new Set());
        setFiltersVisible(false);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (e.key === "Backspace" && !e.metaKey) return; // allow normal Backspace in inputs
        if (selectedDocIds.size > 0) {
          setConfirmDelete({
            type: "document",
            id: "__bulk__",
            title: `${selectedDocIds.size} documents`,
          });
        } else if (selectedDocument) {
          setConfirmDelete({
            type: "document",
            id: selectedDocument.id,
            title: selectedDocument.title,
          });
        }
      }
      if (e.metaKey && e.key === "o" && selectedDocument) {
        openDoc(selectedDocument.filePath);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedDocument, selectedDocIds, confirmDelete, editingDoc, editingBinder, settingsOpen, openDoc]);

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    if (confirmDelete.id === "__bulk__") {
      for (const id of Array.from(selectedDocIds)) {
        await deleteDoc(id);
      }
      setSelectedDocIds(new Set());
    } else if (confirmDelete.type === "document") {
      await deleteDoc(confirmDelete.id);
      if (selectedDocument?.id === confirmDelete.id) {
        setSelectedDocument(null);
      }
    } else if (confirmDelete.type === "binder") {
      await deleteBinder(confirmDelete.id);
      if (selectedBinder?.id === confirmDelete.id) {
        setSelectedBinder(null);
      }
    }
    setConfirmDelete(null);
  }

  async function handleBinderSave(data: Omit<Binder, "id"> & { id?: string }) {
    if (data.id) {
      await updateBinder(data.id, {
        name: data.name,
        color: data.color,
        filterTags: data.filterTags,
      });
    } else {
      await addBinder({
        id: crypto.randomUUID(),
        name: data.name,
        color: data.color,
        filterTags: data.filterTags,
      });
    }
    setEditingBinder(null);
  }

  const filteredTotalKb = sortedDocuments.reduce(
    (sum, doc) => sum + doc.fileSizeKb,
    0
  );
  const filteredTotalSize =
    filteredTotalKb >= 1024
      ? `${(filteredTotalKb / 1024).toFixed(1)} MB`
      : `${filteredTotalKb} KB`;
  const isFiltered = searchQuery !== "" || selectedTags.length > 0;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-[10px]">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-[10px] overflow-hidden">
      {/* Navbar */}
      <Navbar
        selectedBinder={selectedBinder}
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        onClearBinder={() => setSelectedBinder(null)}
        onImport={handleImport}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filtersVisible={filtersVisible}
        onToggleFilters={() => setFiltersVisible(!filtersVisible)}
        allTags={allTags}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        onClearFilters={handleClearFilters}
        onSettings={() => setSettingsOpen(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Binder List */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            sidebarVisible ? "w-72 opacity-100" : "w-0 opacity-0"
          }`}
        >
          <BinderList
            binders={binders}
            documents={documents}
            selectedBinder={selectedBinder}
            onSelectBinder={handleBinderSelect}
            onNewBinder={() => setEditingBinder("new")}
            onEditBinder={(b) => setEditingBinder(b)}
            onDeleteBinder={(b) =>
              setConfirmDelete({ type: "binder", id: b.id, title: b.name })
            }
          />
        </div>

        {/* Center: Documents Grid */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Sort bar */}
          <div className="shrink-0 flex items-center px-4 h-11 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 mr-3">Sort</span>
            <SortControls sortConfig={sortConfig} onSortChange={setSortConfig} />
          </div>
          <main className="flex-1 p-6">
            {sortedDocuments.length > 0 ? (
              <div
                key={selectedBinder?.id ?? "all"}
                className="grid grid-cols-[repeat(auto-fill,180px)] gap-5 animate-grid-fadein"
              >
                {sortedDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    isSelected={selectedDocument?.id === doc.id}
                    isMultiSelected={selectedDocIds.has(doc.id)}
                    onSelect={() => handleDocumentSelect(doc)}
                    onMultiSelect={() => handleMultiSelect(doc.id)}
                    onTagClick={handleTagClick}
                    onOpen={() => openDoc(doc.filePath)}
                    onDelete={() => setConfirmDelete({ type: "document", id: doc.id, title: doc.title })}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                {documents.length === 0 ? (
                  <>
                    <p className="text-lg font-medium mb-2">No documents yet</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Click "+ Add Document" or drag files here to import
                    </p>
                    <button
                      onClick={handleImport}
                      className="px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                    >
                      Import Document
                    </button>
                  </>
                ) : (
                  <>
                    <p>No documents match your criteria.</p>
                    <button
                      onClick={handleClearFilters}
                      className="mt-4 px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                    >
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Right: Preview Pane */}
        <PreviewPane
          document={selectedDocument}
          onTagClick={handleTagClick}
          onUpdateTags={async (docId, tags) => {
            const target = documents.find((d) => d.id === docId);
            if (!target) return;
            await updateDoc(docId, { title: target.title, tags });
            setSelectedDocument((prev) =>
              prev?.id === docId ? { ...prev, tags } : prev
            );
          }}
          onClose={() => setSelectedDocument(null)}
          onOpen={(doc) => openDoc(doc.filePath)}
          onEdit={(doc) => setEditingDoc(doc)}
          onDelete={(doc) =>
            setConfirmDelete({
              type: "document",
              id: doc.id,
              title: doc.title,
            })
          }
        />
      </div>

      {/* Status Bar */}
      <footer className="shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-1.5 flex items-center justify-between gap-4 text-[11px] text-gray-400">
        <div className="flex items-center gap-1.5 min-w-0">
          {selectedBinder ? (
            <>
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: selectedBinder.color }}
              />
              <span className="text-gray-600 dark:text-gray-300 font-medium truncate">
                {selectedBinder.name}
              </span>
            </>
          ) : (
            <span className="text-gray-500">All Documents</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span>{sortedDocuments.length}</span>
          <span>{sortedDocuments.length === 1 ? "document" : "documents"}</span>
          <span className="text-gray-300 dark:text-gray-600 mx-0.5">·</span>
          <span>{filteredTotalSize}</span>
          {isFiltered && (
            <>
              <span className="text-gray-300 dark:text-gray-600 mx-0.5">·</span>
              <span className="text-amber-500">filtered</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          {selectedDocIds.size > 0 ? (
            <span className="text-blue-500">{selectedDocIds.size} selected</span>
          ) : selectedDocument ? (
            <>
              <span className="truncate max-w-[160px] text-gray-600 dark:text-gray-300">
                {selectedDocument.title}
              </span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="uppercase">{selectedDocument.fileType}</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>
                {selectedDocument.fileSizeKb >= 1024
                  ? `${(selectedDocument.fileSizeKb / 1024).toFixed(1)} MB`
                  : `${selectedDocument.fileSizeKb} KB`}
              </span>
            </>
          ) : selectedTags.length > 0 ? (
            <span className="text-amber-500">
              {selectedTags.length}{" "}
              {selectedTags.length === 1 ? "filter" : "filters"} active
            </span>
          ) : (
            <span className="opacity-0 select-none">—</span>
          )}
        </div>
      </footer>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedDocIds.size}
        onDeleteAll={() =>
          setConfirmDelete({
            type: "document",
            id: "__bulk__",
            title: `${selectedDocIds.size} documents`,
          })
        }
        onClearSelection={() => setSelectedDocIds(new Set())}
      />

      {/* Modals */}
      {confirmDelete && (
        <ConfirmModal
          title={
            confirmDelete.type === "binder" ? "Delete Binder" : "Delete Document"
          }
          message={
            confirmDelete.type === "binder"
              ? `Delete binder "${confirmDelete.title}"? Documents will not be affected.`
              : `Delete "${confirmDelete.title}"? This will permanently remove the file.`
          }
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {editingDoc && (
        <EditDocumentModal
          document={editingDoc}
          onSave={async (id, updates) => {
            await updateDoc(id, updates);
            setSelectedDocument((prev) =>
              prev?.id === id ? { ...prev, ...updates } : prev
            );
            setEditingDoc(null);
          }}
          onClose={() => setEditingDoc(null)}
        />
      )}

      {editingBinder !== null && (
        <BinderModal
          binder={editingBinder === "new" ? undefined : editingBinder}
          existingTags={allTags}
          onSave={handleBinderSave}
          onClose={() => setEditingBinder(null)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          documents={documents}
          customTags={customTags}
          onClose={() => setSettingsOpen(false)}
          onRenameTag={renameTagEverywhere}
          onRemoveTag={removeTagEverywhere}
          onAddTag={addCustomTag}
        />
      )}
    </div>
  );
}

export default App;
