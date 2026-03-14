use std::collections::HashSet;
use std::fs;
use std::path::Path;
use std::process::Command;

/// Generate a thumbnail for the given file, saved as `<doc_id>.png` in `thumbs_dir`.
/// Returns the absolute path to the generated PNG, or an empty string on failure.
pub fn generate_thumbnail(source_path: &Path, doc_id: &str, thumbs_dir: &Path) -> String {
    let output_path = thumbs_dir.join(format!("{}.png", doc_id));

    let ext = source_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    // Strategy 1: sips — reliable for image files on macOS, resizes to max 400px
    if matches!(ext.as_str(), "jpg" | "jpeg" | "png" | "gif" | "bmp" | "webp" | "tiff" | "heic") {
        let result = Command::new("/usr/bin/sips")
            .args([
                "-z", "400", "400",
                source_path.to_str().unwrap_or(""),
                "--out", output_path.to_str().unwrap_or(""),
            ])
            .output();

        if result.is_ok() && output_path.exists() {
            return output_path.to_str().unwrap_or("").to_string();
        }

        // Fallback: raw copy (no resize)
        if fs::copy(source_path, &output_path).is_ok() {
            return output_path.to_str().unwrap_or("").to_string();
        }
    }

    // Strategy 2: qlmanage — handles PDF, DOCX, XLSX, and other document types via Quick Look
    // NOTE: qlmanage frequently exits with a non-zero status even on success.
    // We use a before/after directory snapshot to find the newly created file instead of
    // relying on the exit code.
    let before: HashSet<String> = fs::read_dir(thumbs_dir)
        .map(|dir| {
            dir.filter_map(|e| e.ok())
                .map(|e| e.path().to_string_lossy().into_owned())
                .collect()
        })
        .unwrap_or_default();

    let _ = Command::new("/usr/bin/qlmanage")
        .args([
            "-t",
            "-s",
            "400",
            "-o",
            thumbs_dir.to_str().unwrap_or(""),
            source_path.to_str().unwrap_or(""),
        ])
        .output();

    // Find any new .png file that appeared in the thumbnails directory
    if let Ok(entries) = fs::read_dir(thumbs_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            let path_str = path.to_string_lossy().into_owned();
            if !before.contains(&path_str) && path_str.ends_with(".png") {
                if fs::rename(&path, &output_path).is_ok() {
                    return output_path.to_str().unwrap_or("").to_string();
                }
            }
        }
    }

    String::new()
}
