mod commands;
mod models;
mod storage;
mod thumbnail;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::load_state,
            commands::save_state,
            commands::import_document,
            commands::open_document,
            commands::delete_document_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
