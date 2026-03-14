import { Binder, Document } from "../types";
import { getBinderDocuments } from "../utils/binderUtils";

interface BinderListProps {
  binders: Binder[];
  documents: Document[];
  selectedBinder: Binder | null;
  onSelectBinder: (binder: Binder | null) => void;
  onNewBinder: () => void;
  onEditBinder: (binder: Binder) => void;
  onDeleteBinder: (binder: Binder) => void;
}

function NotebookCover({
  binder,
  count,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: {
  binder: Binder;
  count: number;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`relative group rounded-lg transition-all duration-200 ${
      isSelected
        ? "bg-white dark:bg-gray-700 shadow-sm"
        : "hover:bg-white/60 dark:hover:bg-gray-700/60"
    }`}>
      <button
        className="w-full flex items-center gap-3 px-3 py-2 cursor-pointer text-left"
        onClick={onClick}
      >
        {/* Mini notebook cover */}
        <div
          className={`relative shrink-0 rounded-md overflow-hidden shadow-md transition-all duration-200 ${
            isSelected ? "scale-105 shadow-lg" : "group-hover:scale-105 group-hover:shadow-lg"
          }`}
          style={{ width: 44, height: 58, backgroundColor: binder.color }}
        >
          {/* Elastic band */}
          <div
            className="absolute top-0 bottom-0"
            style={{ left: "62%", width: 6, backgroundColor: "rgba(0,0,0,0.18)" }}
          />
          <div
            className="absolute top-0 bottom-0 left-0 w-px"
            style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
          />
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

      {/* Edit / Delete buttons — shown on hover */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-600 p-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
          title="Edit binder"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
          title="Delete binder"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function BinderList({
  binders,
  documents,
  selectedBinder,
  onSelectBinder,
  onNewBinder,
  onEditBinder,
  onDeleteBinder,
}: BinderListProps) {
  return (
    <aside className="w-72 min-w-72 h-full bg-gray-50 dark:bg-gray-850 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 h-11 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Binders
        </span>
        <button
          onClick={onNewBinder}
          className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="New binder"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {/* Permanent "All Documents" entry */}
          <div className={`relative group rounded-lg transition-all duration-200 ${
            selectedBinder === null
              ? "bg-white dark:bg-gray-700 shadow-sm"
              : "hover:bg-white/60 dark:hover:bg-gray-700/60"
          }`}>
            <button
              className="w-full flex items-center gap-3 px-3 py-2 cursor-pointer text-left"
              onClick={() => onSelectBinder(null)}
            >
              {/* Mini notebook cover */}
              <div
                className={`relative shrink-0 rounded-md overflow-hidden shadow-md transition-all duration-200 ${
                  selectedBinder === null ? "scale-105 shadow-lg" : "group-hover:scale-105 group-hover:shadow-lg"
                }`}
                style={{ width: 44, height: 58, backgroundColor: "#6366f1" }}
              >
                <div className="absolute top-0 bottom-0" style={{ left: "62%", width: 6, backgroundColor: "rgba(0,0,0,0.18)" }} />
                <div className="absolute top-0 bottom-0 left-0 w-px" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
                <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: "rgba(0,0,0,0.15)" }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${
                  selectedBinder === null ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                }`}>
                  All Documents
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {documents.length} document{documents.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Selection indicator */}
              {selectedBinder === null && (
                <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: "#6366f1" }} />
              )}
            </button>
          </div>

          {binders.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          )}

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
                onEdit={() => onEditBinder(binder)}
                onDelete={() => onDeleteBinder(binder)}
              />
            );
          })}
          {binders.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">
              No binders yet.
              <br />
              <button
                onClick={onNewBinder}
                className="mt-2 text-indigo-500 hover:text-indigo-600"
              >
                Create one
              </button>
            </p>
          )}
        </div>
      </nav>
    </aside>
  );
}
