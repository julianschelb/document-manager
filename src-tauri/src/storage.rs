use std::fs;
use std::path::PathBuf;
use tauri::Manager;

use crate::models::AppState;

pub struct AppDirs {
    pub state_file: PathBuf,
    pub files_dir: PathBuf,
    pub thumbs_dir: PathBuf,
}

pub fn get_app_dirs(app: &tauri::AppHandle) -> Result<AppDirs, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let files_dir = base.join("files");
    let thumbs_dir = base.join("thumbnails");

    fs::create_dir_all(&files_dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(&thumbs_dir).map_err(|e| e.to_string())?;

    Ok(AppDirs {
        state_file: base.join("state.json"),
        files_dir,
        thumbs_dir,
    })
}

pub fn load_state(app: &tauri::AppHandle) -> Result<AppState, String> {
    let dirs = get_app_dirs(app)?;
    if !dirs.state_file.exists() {
        return Ok(AppState::default());
    }
    let contents = fs::read_to_string(&dirs.state_file).map_err(|e| e.to_string())?;
    serde_json::from_str(&contents).map_err(|e| e.to_string())
}

pub fn save_state(app: &tauri::AppHandle, state: &AppState) -> Result<(), String> {
    let dirs = get_app_dirs(app)?;
    let json = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
    fs::write(&dirs.state_file, json).map_err(|e| e.to_string())
}
