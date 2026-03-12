interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  allTags: string[];
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  selectedTags,
  allTags,
  onTagToggle,
  onClearFilters,
}: SearchBarProps) {
  const hasFilters = searchQuery.length > 0 || selectedTags.length > 0;

  return (
    <div className="search-bar-container">
      <div className="search-input-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {hasFilters && (
          <button className="clear-filters-btn" onClick={onClearFilters}>
            Clear
          </button>
        )}
      </div>

      <div className="tag-filter-row">
        <span className="filter-label">Filter by tag:</span>
        <div className="tag-filter-list">
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag-filter ${selectedTags.includes(tag) ? "active" : ""}`}
              onClick={() => onTagToggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {selectedTags.length > 0 && (
        <div className="active-filters">
          <span>Active filters: </span>
          {selectedTags.map((tag) => (
            <span key={tag} className="active-tag">
              {tag}
              <button
                className="remove-tag"
                onClick={() => onTagToggle(tag)}
                aria-label={`Remove ${tag} filter`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
