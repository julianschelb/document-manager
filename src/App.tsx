import { useState, useMemo } from "react";
import { Binder, Document } from "./types";
import { Navbar } from "./components/Navbar";
import { BinderList } from "./components/BinderList";
import { DocumentCard } from "./components/DocumentCard";
import { DocumentDetail } from "./components/DocumentDetail";
import {
  mockDocuments,
  mockBinders,
  getAllTags,
  getBinderDocuments,
} from "./data/mockDocuments";
import "./styles.css";

function App() {
  const [selectedBinder, setSelectedBinder] = useState<Binder | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const allTags = useMemo(() => getAllTags(mockDocuments), []);

  const filteredDocuments = useMemo(() => {
    const docs = selectedBinder
      ? getBinderDocuments(selectedBinder, mockDocuments)
      : mockDocuments;

    return docs.filter((doc) => {
      const matchesSearch =
        searchQuery === "" ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => doc.tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [searchQuery, selectedTags, selectedBinder]);

  const handleBinderSelect = (binder: Binder | null) => {
    setSelectedBinder(binder);
    setSelectedDocument(null);
  };

  const handleDocumentSelect = (doc: Document) => {
    setSelectedDocument(doc);
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

  const filteredTotalKb = filteredDocuments.reduce((sum, doc) => sum + doc.fileSizeKb, 0);
  const filteredTotalSize = filteredTotalKb >= 1024
    ? `${(filteredTotalKb / 1024).toFixed(1)} MB`
    : `${filteredTotalKb} KB`;

  const isFiltered = searchQuery !== "" || selectedTags.length > 0;

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-[10px] overflow-hidden">
      {/* Top Navbar with integrated search */}
      <Navbar
        selectedBinder={selectedBinder}
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        onClearBinder={() => setSelectedBinder(null)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filtersVisible={filtersVisible}
        onToggleFilters={() => setFiltersVisible(!filtersVisible)}
        allTags={allTags}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        onClearFilters={handleClearFilters}
      />

      {/* Main content area - takes remaining height */}
      <div className="flex-1 flex min-h-0">
        {/* Left Pane: Binder List - animated */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            sidebarVisible ? "w-72 opacity-100" : "w-0 opacity-0"
          }`}
        >
          <BinderList
            binders={mockBinders}
            documents={mockDocuments}
            selectedBinder={selectedBinder}
            onSelectBinder={handleBinderSelect}
          />
        </div>

        {/* Center Pane: Documents Grid */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <main className="flex-1 p-6">
            {filteredDocuments.length > 0 ? (
              <div key={selectedBinder?.id ?? "all"} className="grid grid-cols-[repeat(auto-fill,180px)] gap-5 animate-grid-fadein">
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    isSelected={false}
                    onSelect={() => handleDocumentSelect(doc)}
                    onTagClick={handleTagClick}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>No documents found matching your criteria.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </main>
        </div>

        {/* Right Pane: Document Detail */}
        <DocumentDetail
          document={selectedDocument}
          onTagClick={handleTagClick}
          onClose={() => setSelectedDocument(null)}
        />
      </div>

      {/* Bottom Status Bar */}
      <footer className="shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-1.5 flex items-center justify-between gap-4 text-[11px] text-gray-400">
        {/* Left: context */}
        <div className="flex items-center gap-1.5 min-w-0">
          {selectedBinder ? (
            <>
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: selectedBinder.color }} />
              <span className="text-gray-600 dark:text-gray-300 font-medium truncate">{selectedBinder.name}</span>
            </>
          ) : (
            <span className="text-gray-500">All Documents</span>
          )}
        </div>

        {/* Center: count + size */}
        <div className="flex items-center gap-1 shrink-0">
          <span>{filteredDocuments.length}</span>
          <span>{filteredDocuments.length === 1 ? "document" : "documents"}</span>
          <span className="text-gray-300 dark:text-gray-600 mx-0.5">·</span>
          <span>{filteredTotalSize}</span>
          {isFiltered && (
            <>
              <span className="text-gray-300 dark:text-gray-600 mx-0.5">·</span>
              <span className="text-amber-500">filtered</span>
            </>
          )}
        </div>

        {/* Right: selected doc or active filters */}
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          {selectedDocument ? (
            <>
              <span className="truncate max-w-[160px] text-gray-600 dark:text-gray-300">{selectedDocument.title}</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="uppercase">{selectedDocument.fileType}</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>{selectedDocument.fileSizeKb >= 1024 ? `${(selectedDocument.fileSizeKb / 1024).toFixed(1)} MB` : `${selectedDocument.fileSizeKb} KB`}</span>
            </>
          ) : selectedTags.length > 0 ? (
            <span className="text-amber-500">{selectedTags.length} {selectedTags.length === 1 ? "filter" : "filters"} active</span>
          ) : (
            <span className="opacity-0 select-none">—</span>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
