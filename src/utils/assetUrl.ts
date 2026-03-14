import { convertFileSrc } from "@tauri-apps/api/core";

/**
 * Converts an absolute file system path to a Tauri asset URL
 * suitable for use in <img src> or <iframe src>.
 * Returns empty string for empty paths (caller should show a placeholder).
 */
export function thumbnailSrc(thumbnailPath: string): string {
  if (!thumbnailPath) return "";
  return convertFileSrc(thumbnailPath);
}

/**
 * Converts an absolute file path to a Tauri asset URL for previewing files.
 */
export function fileSrc(filePath: string): string {
  if (!filePath) return "";
  return convertFileSrc(filePath);
}
