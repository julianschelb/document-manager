import { invoke } from "@tauri-apps/api/core";
import { AppState, Document } from "../types";

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
