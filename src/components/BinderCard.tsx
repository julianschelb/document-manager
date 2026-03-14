import { Binder, Document } from "../types";
import { getBinderDocuments } from "../utils/binderUtils";
import { getTagColor } from "../utils/tagColors";

interface BinderCardProps {
  binder: Binder;
  documents: Document[];
  onClick: () => void;
}

export function BinderCard({ binder, documents, onClick }: BinderCardProps) {
  const binderDocuments = getBinderDocuments(binder, documents);
  const docCount = binderDocuments.length;

  return (
    <div
      className="flex h-70 cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
      onClick={onClick}
    >
      {/* Binder spine */}
      <div
        className="binder-spine w-10 rounded-l flex items-center justify-center"
        style={{ backgroundColor: binder.color }}
      >
        <span className="binder-spine-text text-white font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis max-h-60">
          {binder.name}
        </span>
      </div>

      {/* Binder cover */}
      <div className="binder-cover flex-1 rounded-r-lg border border-gray-300 dark:border-gray-600 border-l-0 flex relative">
        {/* Ring holes */}
        <div className="w-6 flex flex-col justify-around py-10 items-center">
          <div className="w-4 h-4 border-3 border-gray-400 rounded-full bg-white dark:bg-gray-800" />
          <div className="w-4 h-4 border-3 border-gray-400 rounded-full bg-white dark:bg-gray-800" />
          <div className="w-4 h-4 border-3 border-gray-400 rounded-full bg-white dark:bg-gray-800" />
        </div>

        {/* Binder content preview */}
        <div className="flex-1 p-5 flex flex-col">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {binder.name}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {docCount} document{docCount !== 1 ? "s" : ""}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-auto">
            {binder.filterTags.slice(0, 4).map((tag) => {
              const color = getTagColor(tag);
              return (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-xs font-medium rounded-xl"
                  style={{
                    backgroundColor: color.bg,
                    color: color.text,
                  }}
                >
                  {tag}
                </span>
              );
            })}
            {binder.filterTags.length > 4 && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-xl bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                +{binder.filterTags.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
