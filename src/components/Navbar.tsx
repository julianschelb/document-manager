import { useRef, useEffect } from "react";
import { Binder, SortConfig } from "../types";
import { getTagColor } from "../utils/tagColors";
import { SortControls } from "./SortControls";

interface NavbarProps {
  selectedBinder: Binder | null;
  onToggleSidebar: () => void;
  onClearBinder: () => void;
  onImport: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filtersVisible: boolean;
  onToggleFilters: () => void;
  allTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

export function Navbar({
  selectedBinder,
  onToggleSidebar,
  onClearBinder,
  onImport,
  searchQuery,
  onSearchChange,
  filtersVisible,
  onToggleFilters,
  allTags,
  selectedTags,
  onTagToggle,
  onClearFilters,
  sortConfig,
  onSortChange,
}: NavbarProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        if (filtersVisible) {
          onToggleFilters();
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filtersVisible, onToggleFilters]);

  return (
    <nav className="bg-indigo-900 flex flex-col shrink-0" data-tauri-drag-region>
      {/* Top row */}
      <div className="h-14 flex items-center pl-[72px] pr-4 gap-3">
        {/* Hamburger */}
        <button
          onClick={onToggleSidebar}
          className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <span className="text-white font-bold text-lg whitespace-nowrap">DocManager</span>

        <div className="h-6 w-px bg-white/20" />

        {/* Add Document button */}
        <button
          onClick={onImport}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          + Add Document
        </button>

        <div className="flex-1" />

        {/* Search bar */}
        <div className="w-full max-w-lg">
          <div className="flex items-center bg-white/10 rounded-lg px-3 gap-2">
            <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            {selectedBinder && (
              <div className="flex items-center gap-1.5 bg-white/15 pl-2 pr-1 py-0.5 rounded shrink-0">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: selectedBinder.color }} />
                <span className="text-white/90 text-xs font-medium max-w-[80px] truncate">
                  {selectedBinder.name}
                </span>
                <button onClick={onClearBinder} className="text-white/50 hover:text-white/80 shrink-0">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <input
              type="text"
              className="flex-1 min-w-0 bg-transparent text-white placeholder-white/50 py-2 text-sm outline-none"
              placeholder={selectedBinder ? "Search in binder..." : "Search all documents..."}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />

            {searchQuery && (
              <button onClick={() => onSearchChange("")} className="text-white/40 hover:text-white/70 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* Filters button with popover */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtersVisible || selectedTags.length > 0
                ? "bg-white/20 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
            {selectedTags.length > 0 && (
              <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {selectedTags.length}
              </span>
            )}
          </button>

          {filtersVisible && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Filter by tags</span>
                {selectedTags.length > 0 && (
                  <button onClick={onClearFilters} className="text-xs text-blue-500 hover:text-blue-600">
                    Clear all
                  </button>
                )}
              </div>
              <div className="p-3 flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                {allTags.map((tag) => {
                  const color = getTagColor(tag);
                  const isActive = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      className="px-2.5 py-1 text-xs font-medium rounded-full transition-all hover:scale-105"
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
            </div>
          )}
        </div>
      </div>

      {/* Sort row */}
      <div className="h-9 flex items-center pl-[72px] pr-4 border-t border-white/10">
        <SortControls sortConfig={sortConfig} onSortChange={onSortChange} />
      </div>
    </nav>
  );
}
