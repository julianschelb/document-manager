import { Document } from "../types";
import { getTagColor } from "../utils/tagColors";
import { thumbnailSrc } from "../utils/assetUrl";

const fileTypeConfig: Record<string, { label: string; bg: string; text: string }> = {
  pdf:  { label: "PDF",  bg: "#fee2e2", text: "#dc2626" },
  docx: { label: "DOCX", bg: "#dbeafe", text: "#2563eb" },
  xlsx: { label: "XLSX", bg: "#dcfce7", text: "#16a34a" },
  jpg:  { label: "JPG",  bg: "#fef9c3", text: "#ca8a04" },
  png:  { label: "PNG",  bg: "#fef9c3", text: "#ca8a04" },
  txt:  { label: "TXT",  bg: "#f3f4f6", text: "#4b5563" },
};

interface DocumentDetailProps {
  document: Document | null;
  onTagClick: (tag: string) => void;
  onClose: () => void;
}

export function DocumentDetail({ document, onTagClick, onClose }: DocumentDetailProps) {
  if (!document) {
    return (
      <aside className="w-80 shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 p-6 text-center">
          <p>Select a document to view details</p>
        </div>
      </aside>
    );
  }

  const formattedDate = new Date(document.dateAdded).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <aside className="w-80 shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Details</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Thumbnail */}
        <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700">
          <img
            src={thumbnailSrc(document.thumbnailPath)}
            alt={document.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-start gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg flex-1">
                {document.title}
              </h3>
              {(() => {
                const ft = fileTypeConfig[document.fileType];
                return ft ? (
                  <span
                    className="px-1.5 py-0.5 text-[10px] font-bold rounded shrink-0 mt-1"
                    style={{ backgroundColor: ft.bg, color: ft.text }}
                  >
                    {ft.label}
                  </span>
                ) : null;
              })()}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date Added</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{formattedDate}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag) => {
                const color = getTagColor(tag);
                return (
                  <button
                    key={tag}
                    className="px-3 py-1.5 text-sm font-medium rounded-full transition-transform hover:scale-105"
                    style={{
                      backgroundColor: color.bg,
                      color: color.text,
                    }}
                    onClick={() => onTagClick(tag)}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2 shrink-0">
        <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
          Open Document
        </button>
        <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          Edit Details
        </button>
      </div>
    </aside>
  );
}
