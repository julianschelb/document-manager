import { SortConfig, SortField } from "../types";

interface SortControlsProps {
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "dateAdded", label: "Date Added" },
  { value: "title", label: "Name" },
  { value: "fileSizeKb", label: "Size" },
  { value: "fileType", label: "Type" },
];

export function SortControls({ sortConfig, onSortChange }: SortControlsProps) {
  function setField(field: SortField) {
    if (field === sortConfig.field) {
      // Toggle direction
      onSortChange({
        field,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      onSortChange({ field, direction: "desc" });
    }
  }

  return (
    <div className="flex items-center gap-1">
      {SORT_OPTIONS.map(({ value, label }) => {
        const isActive = sortConfig.field === value;
        return (
          <button
            key={value}
            onClick={() => setField(value)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? "bg-white/20 text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white/80"
            }`}
          >
            {label}
            {isActive && (
              <svg
                className={`w-3 h-3 transition-transform ${sortConfig.direction === "asc" ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
