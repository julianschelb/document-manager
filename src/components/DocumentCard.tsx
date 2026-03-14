import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Document } from "../types";
import { getTagColor } from "../utils/tagColors";
import { thumbnailSrc } from "../utils/assetUrl";

const fileTypeConfig: Record<string, { label: string; bg: string; text: string }> = {
  pdf:  { label: "PDF",  bg: "#fee2e2", text: "#dc2626" },
  docx: { label: "DOCX", bg: "#dbeafe", text: "#2563eb" },
  xlsx: { label: "XLSX", bg: "#dcfce7", text: "#16a34a" },
  jpg:  { label: "JPG",  bg: "#fef9c3", text: "#ca8a04" },
  jpeg: { label: "JPG",  bg: "#fef9c3", text: "#ca8a04" },
  png:  { label: "PNG",  bg: "#fef9c3", text: "#ca8a04" },
  txt:  { label: "TXT",  bg: "#f3f4f6", text: "#4b5563" },
};

const VISIBLE_TAG_COUNT = 3;

interface DocumentCardProps {
  document: Document;
  isSelected: boolean;
  isMultiSelected: boolean;
  isAnalyzing?: boolean;
  onSelect: () => void;
  onMultiSelect: () => void;
  onTagClick: (tag: string) => void;
  onOpen: () => void;
  onDelete: () => void;
  onReprocess?: () => void;
}

export function DocumentCard({
  document: doc,
  isSelected,
  isMultiSelected,
  isAnalyzing,
  onSelect,
  onMultiSelect,
  onTagClick,
  onOpen,
  onDelete,
  onReprocess,
}: DocumentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Overflow tags popup
  const overflowBtnRef = useRef<HTMLButtonElement>(null);
  const [overflowPos, setOverflowPos] = useState<{ left: number; bottom: number } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showOverflow() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!overflowBtnRef.current) return;
    const r = overflowBtnRef.current.getBoundingClientRect();
    setOverflowPos({ left: r.left, bottom: window.innerHeight - r.top + 6 });
  }

  function scheduleHideOverflow() {
    hideTimer.current = setTimeout(() => setOverflowPos(null), 120);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const formattedDate = new Date(doc.dateAdded).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedSize =
    doc.fileSizeKb >= 1000
      ? `${(doc.fileSizeKb / 1024).toFixed(1)} MB`
      : `${doc.fileSizeKb} KB`;

  const fileType = fileTypeConfig[doc.fileType] ?? fileTypeConfig.txt;
  const thumbUrl = thumbnailSrc(doc.thumbnailPath);

  const visibleTags = doc.tags.slice(0, VISIBLE_TAG_COUNT);
  const overflowTags = doc.tags.slice(VISIBLE_TAG_COUNT);

  function handleClick(e: React.MouseEvent) {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      onMultiSelect();
    } else {
      onSelect();
    }
  }

  return (
    <div
      className={`group relative aspect-210/297 flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] ${
        isSelected || isMultiSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
      }`}
      style={{
        boxShadow:
          isSelected || isMultiSelected
            ? "0 0 0 2px #3b82f6, 0 4px 16px rgba(0,0,0,0.15)"
            : "2px 3px 0 0 #dde3ec, 4px 6px 0 0 #e8ecf2, 0 2px 10px rgba(0,0,0,0.09)",
      }}
      onClick={handleClick}
    >
      {/* Multi-select indicator */}
      {isMultiSelected && (
        <div className="absolute top-2 left-2 z-10 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* AI analyzing indicator */}
      {isAnalyzing && !isMultiSelected && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/40 rounded-full px-1.5 py-0.5">
          <svg className="w-2.5 h-2.5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-[9px] text-white/90 font-medium leading-none">AI</span>
        </div>
      )}

      {/* Three-dot menu */}
      <div
        ref={menuRef}
        className="absolute top-2 right-2 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={`w-6 h-6 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-all ${
            menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          title="More actions"
        >
          <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1">
            <button
              onClick={() => { onOpen(); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open
            </button>
            <div className="border-t border-gray-100 dark:border-gray-700 mx-2 my-0.5" />
            {onReprocess && (
              <>
                <button
                  onClick={() => { onReprocess(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reprocess Document
                </button>
                <div className="border-t border-gray-100 dark:border-gray-700 mx-2 my-0.5" />
              </>
            )}
            <button
              onClick={() => { onDelete(); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Thumbnail */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-700 overflow-hidden">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={doc.title}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="px-2 py-1 text-xs font-bold rounded"
              style={{ backgroundColor: fileType.bg, color: fileType.text }}
            >
              {fileType.label}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="shrink-0 px-3 pt-2.5 pb-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-start gap-1.5 mb-1">
          <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 flex-1 leading-snug">
            {doc.title}
          </h3>
          <span
            className="shrink-0 px-1 py-0.5 text-[9px] font-bold rounded mt-0.5"
            style={{ backgroundColor: fileType.bg, color: fileType.text }}
          >
            {fileType.label}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 mb-2">
          {formattedDate} · {formattedSize}
        </p>

        {/* Tags: show first 3, +N badge for the rest */}
        <div className="flex flex-wrap gap-1">
          {visibleTags.map((tag) => {
            const color = getTagColor(tag);
            return (
              <button
                key={tag}
                className="px-1.5 py-0.5 text-[9px] font-medium rounded-full border-none cursor-pointer transition-transform hover:scale-105"
                style={{ backgroundColor: color.bg, color: color.text }}
                onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
                title={`Filter by ${tag}`}
              >
                {tag}
              </button>
            );
          })}

          {overflowTags.length > 0 && (
            <button
              ref={overflowBtnRef}
              className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={showOverflow}
              onMouseLeave={scheduleHideOverflow}
            >
              +{overflowTags.length}
            </button>
          )}
        </div>
      </div>

      {/* Overflow tags popup — rendered in a portal to escape overflow:hidden */}
      {overflowPos &&
        createPortal(
          <div
            className="fixed z-9999 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 flex flex-wrap gap-1 max-w-50"
            style={{ left: overflowPos.left, bottom: overflowPos.bottom }}
            onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current); }}
            onMouseLeave={scheduleHideOverflow}
            onClick={(e) => e.stopPropagation()}
          >
            {overflowTags.map((tag) => {
              const color = getTagColor(tag);
              return (
                <button
                  key={tag}
                  className="px-1.5 py-0.5 text-[9px] font-medium rounded-full border-none cursor-pointer transition-transform hover:scale-105"
                  style={{ backgroundColor: color.bg, color: color.text }}
                  onClick={(e) => { e.stopPropagation(); onTagClick(tag); setOverflowPos(null); }}
                  title={`Filter by ${tag}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
