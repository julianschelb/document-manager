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
    #[serde(default)]
    pub content: String,
    #[serde(default)]
    pub summary: String,
    #[serde(default)]
    pub correspondence_date: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Binder {
    pub id: String,
    pub name: String,
    pub color: String,
    pub filter_tags: Vec<String>,
}

fn default_true() -> bool {
    true
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub documents: Vec<Document>,
    pub binders: Vec<Binder>,
    #[serde(default)]
    pub custom_tags: Vec<String>,
    #[serde(default)]
    pub open_ai_api_key: String,
    #[serde(default = "default_true")]
    pub ai_enabled: bool,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            documents: Vec::new(),
            binders: Vec::new(),
            custom_tags: Vec::new(),
            open_ai_api_key: String::new(),
            ai_enabled: true,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BinderSuggestion {
    pub name: String,
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AiAnalysis {
    pub title: String,
    pub tags: Vec<String>,
    pub summary: String,
    pub correspondence_date: Option<String>,
}
