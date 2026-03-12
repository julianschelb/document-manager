import { Document } from "../types";

interface DocumentCardProps {
  document: Document;
  onTagClick: (tag: string) => void;
}

export function DocumentCard({ document, onTagClick }: DocumentCardProps) {
  const formattedDate = new Date(document.dateAdded).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <div className="document-card">
      <div className="document-thumbnail">
        <img src={document.thumbnailUrl} alt={document.title} />
      </div>
      <div className="document-info">
        <h3 className="document-title">{document.title}</h3>
        <p className="document-date">{formattedDate}</p>
        <div className="document-tags">
          {document.tags.map((tag) => (
            <button
              key={tag}
              className="tag"
              onClick={() => onTagClick(tag)}
              title={`Filter by ${tag}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
