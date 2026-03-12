import { ViewType } from "../types";

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  currentView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={`${
        isCollapsed ? "w-15" : "w-50"
      } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 transition-all duration-200`}
    >
      <button
        className="p-4 text-xl text-right text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? "›" : "‹"}
      </button>

      <nav className="flex flex-col gap-1 p-2">
        <button
          className={`flex items-center gap-3 p-3 rounded-lg text-sm text-left transition-colors ${
            currentView === "documents"
              ? "bg-blue-500 text-white"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          } ${isCollapsed ? "justify-center" : ""}`}
          onClick={() => onViewChange("documents")}
        >
          <span className="text-xl shrink-0">📄</span>
          {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">All Documents</span>}
        </button>

        <button
          className={`flex items-center gap-3 p-3 rounded-lg text-sm text-left transition-colors ${
            currentView === "binders" || currentView === "binder-detail"
              ? "bg-blue-500 text-white"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          } ${isCollapsed ? "justify-center" : ""}`}
          onClick={() => onViewChange("binders")}
        >
          <span className="text-xl shrink-0">📚</span>
          {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">Binders</span>}
        </button>
      </nav>
    </aside>
  );
}
