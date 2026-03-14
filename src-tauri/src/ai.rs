use std::io::Read;
use std::path::Path;
use std::process::Command;

use base64::Engine;
use serde::Deserialize;

use crate::models::{AiAnalysis, BinderSuggestion};

const IMAGE_TYPES: &[&str] = &["jpg", "jpeg", "png", "gif", "webp"];
const MAX_CONTENT_CHARS: usize = 8_000;

// ── Text extraction ──────────────────────────────────────────────────────────

pub fn extract_text(file_path: &str, file_type: &str) -> String {
    let raw = match file_type {
        "txt" => std::fs::read_to_string(file_path).unwrap_or_default(),
        "pdf" => extract_pdf(file_path),
        "docx" => extract_zip_xml(file_path, "word/document.xml"),
        "xlsx" => extract_zip_xml(file_path, "xl/sharedStrings.xml"),
        _ => String::new(),
    };

    if raw.len() > MAX_CONTENT_CHARS {
        raw[..MAX_CONTENT_CHARS].to_string()
    } else {
        raw
    }
}

fn extract_pdf(path: &str) -> String {
    // Attempt 1: pure-Rust pdf_extract
    let rust_text = pdf_extract::extract_text(Path::new(path))
        .map(|s| s.split_whitespace().collect::<Vec<_>>().join(" "))
        .unwrap_or_default();

    if rust_text.len() >= 200 {
        return rust_text;
    }

    // Attempt 2: system pdftotext (Poppler) — handles complex font encodings that
    // pdf_extract can't decode (e.g. LaTeX/arXiv papers with custom CFF fonts)
    let cli_text = Command::new("pdftotext")
        .args(["-nopgbrk", "-q", path, "-"])
        .output()
        .ok()
        .filter(|o| o.status.success())
        .map(|o| {
            String::from_utf8_lossy(&o.stdout)
                .split_whitespace()
                .collect::<Vec<_>>()
                .join(" ")
        })
        .unwrap_or_default();

    if cli_text.len() > rust_text.len() {
        cli_text
    } else {
        rust_text
    }
}

fn extract_zip_xml(path: &str, entry: &str) -> String {
    let file = match std::fs::File::open(path) {
        Ok(f) => f,
        Err(_) => return String::new(),
    };
    let mut archive = match zip::ZipArchive::new(file) {
        Ok(a) => a,
        Err(_) => return String::new(),
    };
    let mut zip_entry = match archive.by_name(entry) {
        Ok(e) => e,
        Err(_) => return String::new(),
    };
    let mut xml = String::new();
    if zip_entry.read_to_string(&mut xml).is_err() {
        return String::new();
    }
    strip_xml(&xml)
}

fn strip_xml(xml: &str) -> String {
    let mut out = String::with_capacity(xml.len() / 2);
    let mut in_tag = false;
    let mut prev_space = true;

    for ch in xml.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => {
                in_tag = false;
                if !prev_space {
                    out.push(' ');
                    prev_space = true;
                }
            }
            _ if !in_tag => {
                if ch.is_whitespace() {
                    if !prev_space && !out.is_empty() {
                        out.push(' ');
                        prev_space = true;
                    }
                } else {
                    out.push(ch);
                    prev_space = false;
                }
            }
            _ => {}
        }
    }
    out.trim().to_string()
}

// ── OpenAI API ───────────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct OpenAiResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: RespMessage,
}

#[derive(Deserialize)]
struct RespMessage {
    content: String,
}

#[derive(Deserialize)]
struct AiResult {
    title: Option<String>,
    tags: Option<Vec<String>>,
    summary: Option<String>,
    #[serde(rename = "correspondenceDate")]
    correspondence_date: Option<String>,
}

pub async fn analyze_document(
    content: &str,
    file_type: &str,
    file_path: &str,
    existing_tags: &[String],
    api_key: &str,
) -> Result<AiAnalysis, String> {
    let is_image = IMAGE_TYPES.contains(&file_type);

    let system = serde_json::json!({
        "role": "system",
        "content": "You are a document analysis assistant. Analyze the document provided and respond with a JSON object containing exactly four keys: \"title\" (the verbatim or near-verbatim title as it appears in the document — use the document's own heading, paper title, subject line, invoice number + vendor name, contract title, or equivalent identifier; only fall back to a concise descriptive title if the document has no explicit title), \"tags\" (an array of 3–7 lowercase thematic category tags — ONLY use broad, folder-like grouping terms that will apply to many documents, never to just one; good tags are domain areas (\"finance\", \"banking\", \"insurance\", \"tax\", \"invoice\", \"contract\", \"school\", \"university\", \"research\", \"machine-learning\", \"nlp\", \"medical\", \"legal\", \"government\", \"travel\", \"employment\", \"real-estate\") or organisation names (\"zdf\", \"deutsche-bank\", \"amazon\"); NEVER use specific technology names (\"BERT\", \"GPT\", \"transformer\"), proper nouns from the content, or any term that uniquely identifies this single document rather than a class of documents; for academic papers use only the research field (e.g. \"nlp\", \"computer-vision\", \"machine-learning\", \"physics\"); reuse tags from the existing list when appropriate), \"summary\" (exactly 2 complete sentences summarizing the main content and purpose), and \"correspondenceDate\" (the date the document was written, issued, received, or otherwise corresponds to — look for explicit dates in the body such as letter dates, invoice dates, contract dates, report dates; return a string in YYYY-MM-DD format, or null if no clear date is found). Return only valid JSON, no markdown, no extra text."
    });

    let tags_hint = if existing_tags.is_empty() {
        "No existing tags yet.".to_string()
    } else {
        format!("Existing tags to reuse where relevant: {}", existing_tags.join(", "))
    };

    let user_content: serde_json::Value = if is_image {
        let bytes = std::fs::read(file_path)
            .map_err(|e| format!("Cannot read image: {}", e))?;
        let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
        let mime = match file_type {
            "png" => "image/png",
            "gif" => "image/gif",
            "webp" => "image/webp",
            _ => "image/jpeg",
        };
        serde_json::json!([
            {
                "type": "text",
                "text": format!(
                    "Analyze this image document. {}\nReturn JSON with title, tags, summary, and correspondenceDate.",
                    tags_hint
                )
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": format!("data:{};base64,{}", mime, b64),
                    "detail": "low"
                }
            }
        ])
    } else {
        let snippet = if content.len() > 6_000 { &content[..6_000] } else { content };
        serde_json::json!(
            format!(
                "{}\n\nDocument content:\n---\n{}\n---\n\nReturn JSON with title, tags, summary, and correspondenceDate.",
                tags_hint, snippet
            )
        )
    };

    let body = serde_json::json!({
        "model": "gpt-4o-mini",
        "response_format": { "type": "json_object" },
        "max_tokens": 600,
        "messages": [
            system,
            { "role": "user", "content": user_content }
        ]
    });

    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("OpenAI request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("OpenAI API error {}: {}", status, text));
    }

    let parsed: OpenAiResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

    let json_str = parsed
        .choices
        .into_iter()
        .next()
        .map(|c| c.message.content)
        .unwrap_or_default();

    let result: AiResult = serde_json::from_str(&json_str)
        .map_err(|e| format!("Failed to parse AI JSON result: {} — raw: {}", e, json_str))?;

    Ok(AiAnalysis {
        title: result.title.unwrap_or_default(),
        tags: result.tags.unwrap_or_default(),
        summary: result.summary.unwrap_or_default(),
        correspondence_date: result.correspondence_date,
    })
}

// ── Binder suggestion ─────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct BinderResult {
    name: Option<String>,
    tags: Option<Vec<String>>,
}

pub async fn suggest_binders(
    tags: &[String],
    api_key: &str,
) -> Result<Vec<BinderSuggestion>, String> {
    if tags.is_empty() {
        return Ok(vec![]);
    }

    let tag_list = tags.join(", ");

    let body = serde_json::json!({
        "model": "gpt-4o-mini",
        "response_format": { "type": "json_object" },
        "max_tokens": 400,
        "messages": [
            {
                "role": "system",
                "content": "You are a document organisation assistant. Given a list of document tags, group them into a small number of broad, meaningful binder categories. Each binder should be a high-level theme (e.g. 'Finance', 'Research', 'Legal', 'Insurance'). Use short, human-readable names (title-case, 1–3 words). Every tag must appear in exactly one binder. Return a JSON object with a single key \"binders\" whose value is an array of objects, each with keys \"name\" (string) and \"tags\" (array of strings from the input). Do not invent new tags. Return only valid JSON."
            },
            {
                "role": "user",
                "content": format!("Group these tags into binders: {}", tag_list)
            }
        ]
    });

    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("OpenAI request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("OpenAI API error {}: {}", status, text));
    }

    let parsed: OpenAiResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

    let json_str = parsed
        .choices
        .into_iter()
        .next()
        .map(|c| c.message.content)
        .unwrap_or_default();

    #[derive(Deserialize)]
    struct BinderList {
        binders: Vec<BinderResult>,
    }

    let list: BinderList = serde_json::from_str(&json_str)
        .map_err(|e| format!("Failed to parse binder suggestions: {} — raw: {}", e, json_str))?;

    Ok(list
        .binders
        .into_iter()
        .filter_map(|b| {
            let name = b.name.filter(|n| !n.is_empty())?;
            let tags = b.tags.unwrap_or_default();
            if tags.is_empty() {
                None
            } else {
                Some(BinderSuggestion { name, tags })
            }
        })
        .collect())
}
