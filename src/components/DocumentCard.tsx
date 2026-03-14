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

interface DocumentCardProps {
  document: Document;
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelect: () => void;
  onMultiSelect: () => void;
  onTagClick: (tag: string) => void;
}

export function DocumentCard({
  document,
  isSelected,
  isMultiSelected,
  onSelect,
  onMultiSelect,
  onTagClick,
}: DocumentCardProps) {
  const formattedDate = new Date(document.dateAdded).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedSize =
    document.fileSizeKb >= 1000
      ? `${(document.fileSizeKb / 1024).toFixed(1)} MB`
      : `${document.fileSizeKb} KB`;

  const fileType = fileTypeConfig[document.fileType] ?? fileTypeConfig.txt;
  const thumbUrl = thumbnailSrc(document.thumbnailPath);

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
      className={`relative aspect-[210/297] flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:scale-[1.03] ${
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

      {/* Thumbnail */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-700 overflow-hidden">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={document.title}
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
            {document.title}
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
        <div className="flex flex-wrap gap-1">
          {document.tags.map((tag) => {
            const color = getTagColor(tag);
            return (
              <button
                key={tag}
                className="px-1.5 py-0.5 text-[9px] font-medium rounded-full border-none cursor-pointer transition-transform hover:scale-105"
                style={{ backgroundColor: color.bg, color: color.text }}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag);
                }}
                title={`Filter by ${tag}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
