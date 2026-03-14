import { useState, useEffect, useRef, useMemo } from "react";
import { Document } from "../types";
import { getTagColor } from "../utils/tagColors";

interface SettingsModalProps {
  documents: Document[];
  customTags: string[];
  openAiApiKey: string;
  aiEnabled: boolean;
  onClose: () => void;
  onRenameTag: (oldTag: string, newTag: string) => Promise<void>;
  onRemoveTag: (tag: string) => Promise<void>;
  onAddTag: (tag: string) => Promise<void>;
  onUpdateApiKey: (key: string) => Promise<void>;
  onUpdateAiEnabled: (enabled: boolean) => Promise<void>;
}

export function SettingsModal({
  documents,
  customTags,
  openAiApiKey,
  aiEnabled,
  onClose,
  onRenameTag,
  onRemoveTag,
  onAddTag,
  onUpdateApiKey,
  onUpdateAiEnabled,
}: SettingsModalProps) {
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [newTagValue, setNewTagValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const [apiKeyValue, setApiKeyValue] = useState(openAiApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-120 max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700">
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
                    <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500 tabular-nums min-w-8 text-right">
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

          {/* AI section */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                AI
              </h3>
              {openAiApiKey ? (
                <span className="flex items-center gap-1 text-xs text-green-500">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  API key configured
                </span>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">Not configured</span>
              )}
            </div>

            {/* Enable/disable toggle */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable AI on import</span>
              <button
                onClick={() => onUpdateAiEnabled(!aiEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  aiEnabled ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
                title={aiEnabled ? "Click to disable" : "Click to enable"}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    aiEnabled ? "translate-x-4.75" : "translate-x-0.75"
                  }`}
                />
              </button>
            </div>

            {/* API key input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKeyValue}
                  onChange={(e) => { setApiKeyValue(e.target.value); setApiKeySaved(false); }}
                  placeholder="sk-..."
                  className="w-full text-sm px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 dark:focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title={showApiKey ? "Hide" : "Show"}
                >
                  {showApiKey ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={async () => {
                  await onUpdateApiKey(apiKeyValue.trim());
                  setApiKeySaved(true);
                }}
                className="shrink-0 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {apiKeySaved ? "Saved!" : "Save"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
              Used for AI-powered title, tag, and summary generation on import. Stored locally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
