export interface Document {
  id: string;
  title: string;
  dateAdded: string;
  tags: string[];
  thumbnailPath: string;
  fileType: "pdf" | "docx" | "xlsx" | "jpg" | "jpeg" | "png" | "gif" | "txt" | "bin";
  fileSizeKb: number;
  filePath: string;
  originalFileName: string;
  fileHash?: string;
}

export interface Binder {
  id: string;
  name: string;
  color: string;
  filterTags: string[];
}

export interface AppState {
  documents: Document[];
  binders: Binder[];
  customTags: string[];
}

export type SortField = "dateAdded" | "title" | "fileSizeKb" | "fileType";
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export type ViewType = "documents" | "binders" | "binder-detail";
