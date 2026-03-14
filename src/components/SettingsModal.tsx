import { useState, useEffect, useRef, useMemo } from "react";
import { Document } from "../types";
import { getTagColor } from "../utils/tagColors";

interface SettingsModalProps {
  documents: Document[];
  customTags: string[];
  onClose: () => void;
  onRenameTag: (oldTag: string, newTag: string) => Promise<void>;
  onRemoveTag: (tag: string) => Promise<void>;
  onAddTag: (tag: string) => Promise<void>;
}

export function SettingsModal({
  documents,
  customTags,
  onClose,
  onRenameTag,
  onRemoveTag,
  onAddTag,
}: SettingsModalProps) {
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [newTagValue, setNewTagValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Compute sorted union of all tags + usage counts
  const { allTags, tagCounts } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const doc of documents) {
      for (const tag of doc.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    for (const tag of customTags) {
      if (!counts.has(tag)) {
        counts.set(tag, 0);
      }
    }
    const sorted = Array.from(counts.keys()).sort((a, b) =>
      a.localeCompare(b)
    );
    return { allTags: sorted, tagCounts: counts };
  }, [documents, customTags]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editingTag !== null) {
          setEditingTag(null);
        } else {
          onClose();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [editingTag, onClose]);

  // Focus rename input when editing starts
  useEffect(() => {
    if (editingTag !== null) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingTag]);

  function startEdit(tag: string) {
    setEditingTag(tag);
    setEditingValue(tag);
  }

  async function commitEdit() {
    if (editingTag === null) return;
    const trimmed = editingValue.trim();
    if (trimmed && trimmed !== editingTag) {
      await onRenameTag(editingTag, trimmed);
    }
    setEditingTag(null);
  }

  async function handleAddTag() {
    const trimmed = newTagValue.trim();
    if (!trimmed) return;
    await onAddTag(trimmed);
    setNewTagValue("");
    addInputRef.current?.focus();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {/* Tags section */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Tags
            </h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {allTags.length} {allTags.length === 1 ? "tag" : "tags"}
            </span>
          </div>

          {allTags.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
              No tags yet. Add one below.
            </p>
          ) : (
            <ul className="space-y-1 mb-4">
              {allTags.map((tag) => {
                const color = getTagColor(tag);
                const count = tagCounts.get(tag) ?? 0;
                const isEditing = editingTag === tag;

                return (
                  <li
                    key={tag}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group transition-colors"
                  >
                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
                          if (e.key === "Escape") { e.preventDefault(); setEditingTag(null); }
                        }}
                        className="flex-1 text-sm px-2 py-0.5 rounded border border-indigo-400 dark:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-400/50"
                        style={{ minWidth: 0 }}
                      />
                    ) : (
                      <span
                        className="flex-1 text-sm font-medium px-2 py-0.5 rounded-full cursor-pointer select-none"
                        style={{ backgroundColor: color.bg, color: color.text }}
                        onClick={() => startEdit(tag)}
                        title="Click to rename"
                      >
                        {tag}
                      </span>
                    )}

                    {/* Usage count */}
                    <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500 tabular-nums min-w-[2rem] text-right">
                      {count} {count === 1 ? "doc" : "docs"}
                    </span>

                    {/* Edit button */}
                    <button
                      onClick={() => startEdit(tag)}
                      className={`shrink-0 p-1 text-gray-300 hover:text-indigo-500 dark:text-gray-600 dark:hover:text-indigo-400 rounded transition-colors ${isEditing ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"}`}
                      title="Rename tag"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => onRemoveTag(tag)}
                      className="shrink-0 p-1 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove tag everywhere"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Add new tag */}
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={addInputRef}
              type="text"
              value={newTagValue}
              onChange={(e) => setNewTagValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleAddTag(); }
              }}
              placeholder="New tag name…"
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 dark:focus:border-indigo-500 transition"
            />
            <button
              onClick={handleAddTag}
              disabled={!newTagValue.trim()}
              className="shrink-0 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
