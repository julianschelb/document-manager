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

  const totalDocs = selectedBinder
    ? getBinderDocuments(selectedBinder, mockDocuments).length
    : mockDocuments.length;

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
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
              <div key={selectedBinder?.id ?? "all"} className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5 animate-grid-fadein">
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
      <footer className="shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-2 text-center">
        <p className="text-xs text-gray-500">
          {filteredDocuments.length} of {totalDocs} documents
        </p>
      </footer>
    </div>
  );
}

export default App;
