use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Document {
    pub id: String,
    pub title: String,
    pub date_added: String,
    pub tags: Vec<String>,
    pub thumbnail_path: String,
    pub file_type: String,
    pub file_size_kb: u64,
    pub file_path: String,
    pub original_file_name: String,
    pub file_hash: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Binder {
    pub id: String,
    pub name: String,
    pub color: String,
    pub filter_tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub documents: Vec<Document>,
    pub binders: Vec<Binder>,
}
