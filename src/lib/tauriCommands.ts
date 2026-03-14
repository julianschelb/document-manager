import { invoke } from "@tauri-apps/api/core";
import { AppState, Document } from "../types";

export interface AiAnalysis {
  title: string;
  tags: string[];
  summary: string;
  correspondenceDate?: string;
}

export async function loadState(): Promise<AppState> {
  return invoke<AppState>("load_state");
}

export async function saveState(state: AppState): Promise<void> {
  return invoke("save_state", { state });
}

export async function importDocument(sourcePath: string): Promise<Document> {
  return invoke<Document>("import_document", { sourcePath });
}

export async function openDocument(filePath: string): Promise<void> {
  return invoke("open_document", { filePath });
}

export async function deleteDocumentFiles(
  filePath: string,
  thumbnailPath: string
): Promise<void> {
  return invoke("delete_document_files", { filePath, thumbnailPath });
}

export async function analyzeDocumentWithAi(
  filePath: string,
  fileType: string,
  content: string,
  existingTags: string[]
): Promise<AiAnalysis> {
  return invoke<AiAnalysis>("analyze_document_with_ai", {
    filePath,
    fileType,
    content,
    existingTags,
  });
}
