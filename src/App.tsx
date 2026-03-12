import { useState, useMemo } from "react";
import { SearchBar } from "./components/SearchBar";
import { DocumentCard } from "./components/DocumentCard";
import { mockDocuments, getAllTags } from "./data/mockDocuments";
import "./styles.css";

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => getAllTags(mockDocuments), []);

  const filteredDocuments = useMemo(() => {
    return mockDocuments.filter((doc) => {
      // Filter by search query (title match)
      const matchesSearch =
        searchQuery === "" ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by selected tags (must have ALL selected tags)
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => doc.tags.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [searchQuery, selectedTags]);

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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Document Manager</h1>
      </header>

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTags={selectedTags}
        allTags={allTags}
        onTagToggle={handleTagToggle}
        onClearFilters={handleClearFilters}
      />

      <main className="document-grid">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onTagClick={handleTagClick}
            />
          ))
        ) : (
          <div className="no-results">
            <p>No documents found matching your criteria.</p>
            <button onClick={handleClearFilters}>Clear filters</button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          {filteredDocuments.length} of {mockDocuments.length} documents
        </p>
      </footer>
    </div>
  );
}

export default App;
