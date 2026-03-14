interface BulkActionBarProps {
  selectedCount: number;
  onDeleteAll: () => void;
  onClearSelection: () => void;
}

export function BulkActionBar({
  selectedCount,
  onDeleteAll,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-9 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto flex items-center gap-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl shadow-2xl px-5 py-3 text-sm"
        style={{ animation: "bulkBarIn 0.15s ease-out both" }}
      >
        <span className="font-medium">
          {selectedCount} {selectedCount === 1 ? "document" : "documents"} selected
        </span>
        <div className="w-px h-4 bg-white/20" />
        <button
          onClick={onDeleteAll}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-medium transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete {selectedCount}
        </button>
        <button
          onClick={onClearSelection}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
