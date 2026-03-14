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

interface PreviewPaneProps {
  document: Document | null;
  onTagClick: (tag: string) => void;
  onClose: () => void;
  onOpen: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

export function PreviewPane({
  document,
  onTagClick,
  onClose,
  onOpen,
  onEdit,
  onDelete,
}: PreviewPaneProps) {
  const emptyState = (
    <aside className="w-80 shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm p-6 text-center">
        Select a document to view details
      </div>
    </aside>
  );

  if (!document) return emptyState;

  const formattedDate = new Date(document.dateAdded).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedSize =
    document.fileSizeKb >= 1024
      ? `${(document.fileSizeKb / 1024).toFixed(1)} MB`
      : `${document.fileSizeKb} KB`;

  const fileType = fileTypeConfig[document.fileType] ?? fileTypeConfig.txt;
  const isImage = IMAGE_TYPES.includes(document.fileType);
  const isPdf = document.fileType === PDF_TYPE;
  const hasPreview = (isImage || isPdf) && document.filePath;

  return (
    <aside className="w-80 shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Details</span>
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
      <div className="shrink-0 bg-gray-100 dark:bg-gray-700" style={{ height: 220 }}>
        {hasPreview ? (
          isPdf ? (
            <iframe
              src={fileSrc(document.filePath)}
              className="w-full h-full border-0"
              title={document.title}
            />
          ) : (
            <img
              src={fileSrc(document.filePath)}
              alt={document.title}
              className="w-full h-full object-contain"
            />
          )
        ) : document.thumbnailPath ? (
          <img
            src={thumbnailSrc(document.thumbnailPath)}
            alt={document.title}
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Title + badge */}
        <div className="flex items-start gap-2">
          <h2 className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
            {document.title}
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
          <span>{formattedDate}</span>
          <span>{formattedSize}</span>
          {document.originalFileName && document.originalFileName !== document.title && (
            <span className="truncate text-gray-300 dark:text-gray-600" title={document.originalFileName}>
              {document.originalFileName}
            </span>
          )}
        </div>

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {document.tags.map((tag) => {
              const color = getTagColor(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  className="px-2 py-0.5 text-xs font-medium rounded-full border-none cursor-pointer transition-transform hover:scale-105"
                  style={{ backgroundColor: color.bg, color: color.text }}
                  title={`Filter by ${tag}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
        <button
          onClick={() => onOpen(document)}
          disabled={!document.filePath}
          className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          Open Document
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(document)}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(document)}
            className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </aside>
  );
}
