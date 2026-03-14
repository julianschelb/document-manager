import { Binder, Document } from "../types";
import { getBinderDocuments } from "../data/mockDocuments";

interface BinderListProps {
  binders: Binder[];
  documents: Document[];
  selectedBinder: Binder | null;
  onSelectBinder: (binder: Binder | null) => void;
}

function NotebookCover({
  binder,
  count,
  isSelected,
  onClick,
}: {
  binder: Binder;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer text-left group ${
        isSelected
          ? "bg-white dark:bg-gray-700 shadow-sm"
          : "hover:bg-white/60 dark:hover:bg-gray-700/60"
      }`}
      onClick={onClick}
    >
      {/* Mini notebook cover */}
      <div
        className={`relative shrink-0 rounded-md overflow-hidden shadow-md transition-all duration-200 ${
          isSelected ? "scale-105 shadow-lg" : "group-hover:scale-105 group-hover:shadow-lg"
        }`}
        style={{
          width: 44,
          height: 58,
          backgroundColor: binder.color,
        }}
      >
        {/* Elastic band — vertical stripe */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: "62%",
            width: 6,
            backgroundColor: "rgba(0,0,0,0.18)",
          }}
        />
        {/* Subtle highlight on left edge */}
        <div
          className="absolute top-0 bottom-0 left-0 w-px"
          style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
        />
        {/* Page edge bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
        />
      </div>

      {/* Binder info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${
          isSelected ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
        }`}>
          {binder.name}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {count} document{count !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div
          className="w-1.5 h-6 rounded-full shrink-0"
          style={{ backgroundColor: binder.color }}
        />
      )}
    </button>
  );
}

export function BinderList({
  binders,
  documents,
  selectedBinder,
  onSelectBinder,
}: BinderListProps) {
  return (
    <aside className="w-72 min-w-72 h-full bg-gray-50 dark:bg-gray-850 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {binders.map((binder) => {
            const count = getBinderDocuments(binder, documents).length;
            const isSelected = selectedBinder?.id === binder.id;

            return (
              <NotebookCover
                key={binder.id}
                binder={binder}
                count={count}
                isSelected={isSelected}
                onClick={() => onSelectBinder(binder)}
              />
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
