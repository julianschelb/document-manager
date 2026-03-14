import { useState, useRef, useEffect } from "react";
import { Document } from "../types";
import { getTagColor } from "../utils/tagColors";
import { thumbnailSrc, fileSrc } from "../utils/assetUrl";

const fileTypeConfig: Record<string, { label: string; bg: string; text: string }> = {
  pdf:  { label: "PDF",  bg: "#fee2e2", text: "#dc2626" },
  docx: { label: "DOCX", bg: "#dbeafe", text: "#2563eb" },
  xlsx: { label: "XLSX", bg: "#dcfce7", text: "#16a34a" },
  jpg:  { label: "JPG",  bg: "#fef9c3", text: "#ca8a04" },
  jpeg: { label: "JPG",  bg: "#fef9c3", text: "#ca8a04" },
  png:  { label: "PNG",  bg: "#fef9c3", text: "#ca8a04" },
  txt:  { label: "TXT",  bg: "#f3f4f6", text: "#4b5563" },
};

const IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
const PDF_TYPE = "pdf";
const DEFAULT_WIDTH = 461; // 384 * 1.2
const MIN_WIDTH = 260;
const MAX_WIDTH = 680;
const DEFAULT_PREVIEW_H = 200;
const MIN_PREVIEW_H = 80;
const MAX_PREVIEW_H = 440;

interface PreviewPaneProps {
  document: Document | null;
  isAnalyzing?: boolean;
  onTagClick: (tag: string) => void;
  onUpdateTags: (docId: string, tags: string[]) => void;
  onClose: () => void;
  onOpen: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onReprocess?: () => void;
}

export function PreviewPane({
  document: doc,
  isAnalyzing,
  onTagClick,
  onUpdateTags,
  onClose,
  onOpen,
  onEdit,
  onDelete,
  onReprocess,
}: PreviewPaneProps) {
  // --- Resize state ---
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // --- Preview height resize state ---
  const [previewHeight, setPreviewHeight] = useState(DEFAULT_PREVIEW_H);
  const isPreviewResizing = useRef(false);
  const previewStartY = useRef(0);
  const previewStartH = useRef(0);

  // --- Tag editing state ---
  const [editingTagIdx, setEditingTagIdx] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState("");
  const editTagInputRef = useRef<HTMLInputElement>(null);
  const addTagInputRef = useRef<HTMLInputElement>(null);

  // --- Drag overlay (prevents iframe/img from stealing events during resize) ---
  const [isDragging, setIsDragging] = useState(false);

  // --- Content expand state ---
  const [contentExpanded, setContentExpanded] = useState(false);

  // Reset tag editing + content expand when switching documents
  useEffect(() => {
    setEditingTagIdx(null);
    setEditingTagValue("");
    setAddingTag(false);
    setContentExpanded(false);
    setNewTagValue("");
  }, [doc?.id]);

  // Focus the rename input when it appears
  useEffect(() => {
    if (editingTagIdx !== null) editTagInputRef.current?.focus();
  }, [editingTagIdx]);

  // Focus the add-tag input when it appears
  useEffect(() => {
    if (addingTag) addTagInputRef.current?.focus();
  }, [addingTag]);

  // --- Resize handlers (horizontal pane width + vertical preview height) ---
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (isResizing.current) {
        const delta = startX.current - e.clientX;
        setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth.current + delta)));
      }
      if (isPreviewResizing.current) {
        const delta = e.clientY - previewStartY.current;
        setPreviewHeight(Math.max(MIN_PREVIEW_H, Math.min(MAX_PREVIEW_H, previewStartH.current + delta)));
      }
    }
    function handleMouseUp() {
      if (isResizing.current || isPreviewResizing.current) {
        isResizing.current = false;
        isPreviewResizing.current = false;
        window.document.body.style.cursor = "";
        window.document.body.style.userSelect = "";
        setIsDragging(false);
      }
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  function handleResizeStart(e: React.MouseEvent) {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    window.document.body.style.cursor = "col-resize";
    window.document.body.style.userSelect = "none";
    setIsDragging(true);
    e.preventDefault();
  }

  function handlePreviewResizeStart(e: React.MouseEvent) {
    isPreviewResizing.current = true;
    previewStartY.current = e.clientY;
    previewStartH.current = previewHeight;
    window.document.body.style.cursor = "row-resize";
    window.document.body.style.userSelect = "none";
    setIsDragging(true);
    e.preventDefault();
  }

  // --- Tag helpers ---
  function removeTag(tag: string) {
    if (!doc) return;
    onUpdateTags(doc.id, doc.tags.filter((t) => t !== tag));
  }

  function startEditTag(idx: number) {
    if (!doc) return;
    setEditingTagIdx(idx);
    setEditingTagValue(doc.tags[idx]);
  }

  function commitTagEdit(idx: number) {
    if (!doc) return;
    const trimmed = editingTagValue.trim().toLowerCase();
    if (trimmed && trimmed !== doc.tags[idx] && !doc.tags.includes(trimmed)) {
      onUpdateTags(doc.id, doc.tags.map((t, i) => (i === idx ? trimmed : t)));
    } else if (!trimmed) {
      onUpdateTags(doc.id, doc.tags.filter((_, i) => i !== idx));
    }
    setEditingTagIdx(null);
  }

  function commitAddTag() {
    if (!doc) return;
    const trimmed = newTagValue.trim().toLowerCase();
    if (trimmed && !doc.tags.includes(trimmed)) {
      onUpdateTags(doc.id, [...doc.tags, trimmed]);
    }
    setAddingTag(false);
    setNewTagValue("");
  }

  const asideStyle = { width, minWidth: width, maxWidth: width };

  const sharedAside = (children: React.ReactNode) => (
    <aside
      className="relative shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full"
      style={asideStyle}
    >
      <div
        className="absolute left-0 top-0 w-1 h-full cursor-col-resize group z-10"
        onMouseDown={handleResizeStart}
      >
        <div className="w-full h-full group-hover:bg-indigo-400/40 transition-colors" />
      </div>
      {children}
    </aside>
  );

  if (!doc) {
    return sharedAside(
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm p-6 text-center">
        Select a document to view details
      </div>
    );
  }

  const formattedDate = new Date(doc.dateAdded).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedSize =
    doc.fileSizeKb >= 1024
      ? `${(doc.fileSizeKb / 1024).toFixed(1)} MB`
      : `${doc.fileSizeKb} KB`;

  const fileType = fileTypeConfig[doc.fileType] ?? fileTypeConfig.txt;
  const isImage = IMAGE_TYPES.includes(doc.fileType);
  const isPdf = doc.fileType === PDF_TYPE;
  const hasPreview = (isImage || isPdf) && doc.filePath;

  return sharedAside(
    <>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 h-11 border-b border-gray-100 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Preview area */}
      <div className="shrink-0 bg-gray-100 dark:bg-gray-700 relative" style={{ height: previewHeight }}>
        {hasPreview ? (
          isPdf ? (
            <iframe
              src={fileSrc(doc.filePath)}
              className="w-full h-full border-0"
              title={doc.title}
            />
          ) : (
            <img
              src={fileSrc(doc.filePath)}
              alt={doc.title}
              className="w-full h-full object-contain"
            />
          )
        ) : doc.thumbnailPath ? (
          <img
            src={thumbnailSrc(doc.thumbnailPath)}
            alt={doc.title}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="px-3 py-1.5 text-sm font-bold rounded-lg"
              style={{ backgroundColor: fileType.bg, color: fileType.text }}
            >
              {fileType.label}
            </span>
          </div>
        )}
        {/* Transparent overlay blocks iframe/img from stealing pointer events during drag */}
        {isDragging && <div className="absolute inset-0 z-20" />}
        {/* Drag handle to resize preview height */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-row-resize group z-10"
          onMouseDown={handlePreviewResizeStart}
        >
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200 dark:bg-gray-600 group-hover:bg-indigo-400/60 transition-colors" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Title + badge */}
        <div className="flex items-start gap-2">
          <h2 className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
            {doc.title}
          </h2>
          <span
            className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded mt-0.5"
            style={{ backgroundColor: fileType.bg, color: fileType.text }}
          >
            {fileType.label}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-1 text-xs text-gray-400">
          {doc.correspondenceDate && (
            <div className="flex items-baseline gap-1.5">
              <span className="font-medium text-gray-500 dark:text-gray-400 w-12 shrink-0">Dated</span>
              <span>
                {new Date(doc.correspondenceDate + "T12:00:00").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="font-medium text-gray-500 dark:text-gray-400 w-12 shrink-0">Added</span>
            <span>{formattedDate}</span>
          </div>
          <span>{formattedSize}</span>
          {doc.originalFileName && doc.originalFileName !== doc.title && (
            <span className="truncate text-gray-300 dark:text-gray-600" title={doc.originalFileName}>
              {doc.originalFileName}
            </span>
          )}
        </div>

        {/* Tags — inline editable */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {doc.tags.map((tag, idx) => {
              const color = getTagColor(tag);

              if (editingTagIdx === idx) {
                return (
                  <input
                    key={tag}
                    ref={editTagInputRef}
                    value={editingTagValue}
                    onChange={(e) => setEditingTagValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); commitTagEdit(idx); }
                      if (e.key === "Escape") setEditingTagIdx(null);
                    }}
                    onBlur={() => commitTagEdit(idx)}
                    className="px-2 py-0.5 text-xs font-medium rounded-full outline-none border border-indigo-400"
                    style={{ backgroundColor: color.bg, color: color.text, width: Math.max(60, editingTagValue.length * 7 + 16) }}
                  />
                );
              }

              return (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 pl-2 pr-0.5 py-0.5 text-xs font-medium rounded-full"
                  style={{ backgroundColor: color.bg, color: color.text }}
                >
                  {/* Click label to rename */}
                  <button
                    onClick={() => startEditTag(idx)}
                    className="leading-none hover:underline"
                    title="Click to rename"
                  >
                    {tag}
                  </button>
                  {/* Filter shortcut */}
                  <button
                    onClick={() => onTagClick(tag)}
                    className="ml-1 opacity-40 hover:opacity-80 transition-opacity leading-none"
                    title={`Filter by "${tag}"`}
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </button>
                  {/* Remove */}
                  <button
                    onClick={() => removeTag(tag)}
                    className="opacity-40 hover:opacity-80 transition-opacity leading-none"
                    title={`Remove "${tag}"`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              );
            })}

            {/* Add tag */}
            {addingTag ? (
              <input
                ref={addTagInputRef}
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commitAddTag(); }
                  if (e.key === "Escape") { setAddingTag(false); setNewTagValue(""); }
                }}
                onBlur={commitAddTag}
                placeholder="new tag…"
                className="px-2 py-0.5 text-xs rounded-full border border-indigo-400 outline-none bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-300"
                style={{ width: 80 }}
              />
            ) : (
              <button
                onClick={() => setAddingTag(true)}
                className="px-2 py-0.5 text-xs rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
              >
                + tag
              </button>
            )}
          </div>
        </div>

        {/* Summary / AI status */}
        {(isAnalyzing || doc.summary) && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Summary
            </span>
            {isAnalyzing ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="w-3 h-3 animate-spin text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                AI is analyzing…
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed">{doc.summary}</p>
            )}
          </div>
        )}

        {/* Content (collapsible) */}
        {doc.content && (
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setContentExpanded((v) => !v)}
              className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Content {contentExpanded ? "▾" : "▸"}
            </button>
            {contentExpanded && (
              <pre className="text-xs text-gray-600 dark:text-gray-300 font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-2 leading-relaxed">
                {doc.content}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
        <button
          onClick={() => onOpen(doc)}
          disabled={!doc.filePath}
          className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          Open Document
        </button>
        {onReprocess && (
          <button
            onClick={onReprocess}
            disabled={isAnalyzing}
            className="w-full px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing…
              </>
            ) : (
              "Reprocess Document"
            )}
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(doc)}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(doc)}
            className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </>
  );
}
