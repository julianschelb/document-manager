import { getTagColor } from "../utils/tagColors";

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
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-col items-center gap-4">
      <div className="w-full max-w-xl flex gap-2">
        <input
          type="text"
          className="flex-1 px-4 py-2.5 text-base border border-gray-300 dark:border-gray-600 rounded-full outline-none focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 transition-colors"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {hasFilters && (
          <button
            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            onClick={onClearFilters}
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {allTags.map((tag) => {
          const color = getTagColor(tag);
          const isActive = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              className="px-3.5 py-1.5 text-sm font-medium rounded-full border-none cursor-pointer transition-transform hover:scale-105 hover:shadow-md"
              style={{
                backgroundColor: isActive ? color.text : color.bg,
                color: isActive ? "#fff" : color.text,
              }}
              onClick={() => onTagToggle(tag)}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </header>
  );
}
