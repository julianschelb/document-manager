import { useState, useEffect, useRef } from "react";
import { Binder } from "../types";

interface BinderModalProps {
  binder?: Binder;
  existingTags: string[];
  onSave: (data: Omit<Binder, "id"> & { id?: string }) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  "#2d6a9f", "#c0392b", "#27ae60", "#8e44ad", "#d35400",
  "#16a085", "#e67e22", "#2980b9", "#8e44ad", "#c0392b",
];

export function BinderModal({ binder, existingTags, onSave, onClose }: BinderModalProps) {
  const [name, setName] = useState(binder?.name ?? "");
  const [color, setColor] = useState(binder?.color ?? "#2d6a9f");
  const [filterTags, setFilterTags] = useState<string[]>(
    binder?.filterTags ? [...binder.filterTags] : []
  );
  const [tagInput, setTagInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function toggleTag(tag: string) {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addCustomTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !filterTags.includes(t)) {
      setFilterTags((prev) => [...prev, t]);
    }
    setTagInput("");
  }

  function handleSave() {
    if (name.trim()) {
      onSave({
        ...(binder?.id ? { id: binder.id } : {}),
        name: name.trim(),
        color,
        filterTags,
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-120 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {binder ? "Edit Binder" : "New Binder"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Name</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="e.g. Insurance"
            className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Color</label>
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${color === c ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
              title="Custom color"
            />
          </div>
          <div
            className="h-2 rounded-full w-full"
            style={{ backgroundColor: color }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Filter Tags
            <span className="ml-1 text-gray-400 font-normal">(documents with these tags appear in this binder)</span>
          </label>
          {existingTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {existingTags.map((tag) => {
                const active = filterTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      active
                        ? "bg-indigo-600 text-white border-transparent"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
              placeholder="Add custom tag..."
              className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addCustomTag}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              Add
            </button>
          </div>
          {filterTags.length > 0 && (
            <div className="flex flex-wrap gap-1 text-xs text-gray-500">
              Active: {filterTags.join(", ")}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {binder ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
