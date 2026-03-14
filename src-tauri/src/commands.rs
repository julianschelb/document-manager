use std::fs;
use std::path::Path;
use std::process::Command;

use chrono::Local;
use hex;
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::models::{AiAnalysis, AppState, BinderSuggestion, Document};
use crate::storage::{get_app_dirs, load_state as do_load, save_state as do_save};
use crate::thumbnail::generate_thumbnail;

#[tauri::command]
pub async fn load_state(app: tauri::AppHandle) -> Result<AppState, String> {
    do_load(&app)
}

#[tauri::command]
pub async fn save_state(app: tauri::AppHandle, state: AppState) -> Result<(), String> {
    do_save(&app, &state)
}

#[tauri::command]
pub async fn import_document(
    app: tauri::AppHandle,
    source_path: String,
) -> Result<Document, String> {
    let source = Path::new(&source_path);

    // Read file bytes and compute SHA-256 hash
    let bytes = fs::read(source).map_err(|e| format!("Cannot read file: {}", e))?;
    let hash = hex::encode(Sha256::digest(&bytes));

    // Check for duplicate by hash
    let current_state = do_load(&app)?;
    if let Some(existing) = current_state
        .documents
        .iter()
        .find(|d| d.file_hash.as_deref() == Some(&hash))
    {
        return Err(format!("DUPLICATE:{}", existing.id));
    }

    // Get app directories
    let dirs = get_app_dirs(&app)?;

    // Generate unique ID and copy file to app storage
    let doc_id = Uuid::new_v4().to_string();
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("bin")
        .to_lowercase();
    let dest_path = dirs.files_dir.join(format!("{}.{}", doc_id, ext));
    fs::copy(source, &dest_path).map_err(|e| format!("Cannot copy file: {}", e))?;

    // Generate thumbnail
    let thumb_path = generate_thumbnail(&dest_path, &doc_id, &dirs.thumbs_dir);

    // Extract text content synchronously (AI enrichment is triggered from the frontend)
    let content = crate::ai::extract_text(dest_path.to_str().unwrap_or(""), &ext);

    // Build Document record
    let file_size_kb = (bytes.len() as u64) / 1024;
    let original_file_name = source
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();
    let title = source
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(&original_file_name)
        .to_string();
    let date_added = Local::now().format("%Y-%m-%d").to_string();

    // Use the source file's creation date as initial correspondence date; fall back to today
    let correspondence_date = fs::metadata(source)
        .ok()
        .and_then(|m| m.created().ok())
        .map(|t| {
            let dt: chrono::DateTime<chrono::Utc> = t.into();
            dt.format("%Y-%m-%d").to_string()
        })
        .unwrap_or_else(|| date_added.clone());

    Ok(Document {
        id: doc_id,
        title,
        date_added,
        tags: vec![],
        manual_tags: vec![],
        thumbnail_path: thumb_path,
        file_type: ext,
        file_size_kb,
        file_path: dest_path.to_str().unwrap_or("").to_string(),
        original_file_name,
        file_hash: Some(hash),
        content,
        summary: String::new(),
        correspondence_date,
    })
}

#[tauri::command]
pub async fn analyze_document_with_ai(
    app: tauri::AppHandle,
    file_path: String,
    file_type: String,
    content: String,
    existing_tags: Vec<String>,
) -> Result<AiAnalysis, String> {
    let state = do_load(&app)?;
    if state.open_ai_api_key.is_empty() {
        return Err("AI_NO_KEY".to_string());
    }
    // Re-extract content from the file; fall back to the caller-supplied content
    // (e.g. freshly extracted on import) only when re-extraction returns nothing.
    let fresh_content = crate::ai::extract_text(&file_path, &file_type);
    let effective_content = if fresh_content.len() > content.len() {
        fresh_content
    } else {
        content
    };
    crate::ai::analyze_document(
        &effective_content,
        &file_type,
        &file_path,
        &existing_tags,
        &state.open_ai_api_key,
    )
    .await
}

#[tauri::command]
pub async fn open_document(file_path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    let program = "open";
    #[cfg(target_os = "linux")]
    let program = "xdg-open";
    #[cfg(target_os = "windows")]
    let program = "explorer";

    Command::new(program)
        .arg(&file_path)
        .spawn()
        .map_err(|e| format!("Cannot open file: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn delete_document_files(
    file_path: String,
    thumbnail_path: String,
) -> Result<(), String> {
    for path_str in [&file_path, &thumbnail_path] {
        if !path_str.is_empty() {
            let p = Path::new(path_str.as_str());
            if p.exists() {
                fs::remove_file(p).map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn suggest_binders_with_ai(
    app: tauri::AppHandle,
    tags: Vec<String>,
    document_tag_sets: Vec<Vec<String>>,
) -> Result<Vec<BinderSuggestion>, String> {
    let state = do_load(&app)?;
    if state.open_ai_api_key.is_empty() {
        return Err("AI_NO_KEY".to_string());
    }
    crate::ai::suggest_binders(&tags, &document_tag_sets, &state.open_ai_api_key).await
}
