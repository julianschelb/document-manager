import { Binder, Document } from "../types";

export function getBinderDocuments(binder: Binder, documents: Document[]): Document[] {
  return documents.filter((doc) =>
    doc.tags.some((tag) => binder.filterTags.includes(tag))
  );
}

export function getAllTags(documents: Document[]): string[] {
  const tagSet = new Set<string>();
  documents.forEach((doc) => doc.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}
