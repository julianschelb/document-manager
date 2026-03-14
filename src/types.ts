export interface Document {
  id: string;
  title: string;
  dateAdded: string;
  tags: string[];
  thumbnailUrl: string;
  fileType: "pdf" | "docx" | "xlsx" | "jpg" | "png" | "txt";
  fileSizeKb: number;
}

export interface Binder {
  id: string;
  name: string;
  color: string;
  filterTags: string[];
}

export type ViewType = "documents" | "binders" | "binder-detail";
