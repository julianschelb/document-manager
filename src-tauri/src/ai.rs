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
        "content": "You are a document analysis assistant. Analyze the document provided and respond with a JSON object containing exactly four keys: \"title\" (the verbatim or near-verbatim title as it appears in the document — use the document's own heading, paper title, subject line, invoice number + vendor name, contract title, or equivalent identifier; only fall back to a concise descriptive title if the document has no explicit title), \"tags\" (an array of 5–15 lowercase tags — be thorough and extract tags from every useful dimension: (1) domain/theme: \"finance\", \"invoice\", \"contract\", \"tax\", \"insurance\", \"legal\", \"medical\", \"research\", \"university\", \"employment\", \"travel\", \"real-estate\", \"government\"; (2) companies, organisations, and brands mentioned: \"amazon\", \"deutsche-bank\", \"zdf\", \"apple\", \"google\", etc.; (3) senders and recipients by name or role: \"julian\", \"hr-department\", \"steuerberater\"; (4) document language: \"german\", \"english\", \"french\", etc.; (5) document type: \"letter\", \"receipt\", \"statement\", \"thesis\", \"paper\", \"form\", \"report\", \"certificate\"; (6) significant keywords from the title or subject line; (7) technology, product, or topic names for technical documents: \"machine-learning\", \"nlp\", \"python\", \"kubernetes\"; always reuse tags from the existing list when they fit; lowercase, hyphenate multi-word tags), \"summary\" (exactly 2 complete sentences summarizing the main content and purpose), and \"correspondenceDate\" (the date the document was written, issued, received, or otherwise corresponds to — look for explicit dates in the body such as letter dates, invoice dates, contract dates, report dates; return a string in YYYY-MM-DD format, or null if no clear date is found). Return only valid JSON, no markdown, no extra text."
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
        "max_tokens": 800,
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
    doc_tag_sets: &[Vec<String>],
    api_key: &str,
) -> Result<Vec<BinderSuggestion>, String> {
    if tags.is_empty() {
        return Ok(vec![]);
    }

    let tag_list = tags.join(", ");

    // Build a compact co-occurrence hint: list each document's tags (skip empty / single-tag docs)
    let cooccurrence: Vec<String> = doc_tag_sets
        .iter()
        .filter(|s| s.len() >= 2)
        .map(|s| s.join(", "))
        .collect();

    let cooccurrence_section = if cooccurrence.is_empty() {
        String::new()
    } else {
        // Deduplicate and cap to 60 rows to keep the prompt short
        let mut seen = std::collections::HashSet::new();
        let rows: Vec<&String> = cooccurrence
            .iter()
            .filter(|row| seen.insert(row.as_str()))
            .take(60)
            .collect();
        format!(
            "\n\nTag co-occurrences observed across documents (each line = one document's tags):\n{}",
            rows.iter().map(|r| format!("- {}", r)).collect::<Vec<_>>().join("\n")
        )
    };

    let body = serde_json::json!({
        "model": "gpt-4o-mini",
        "response_format": { "type": "json_object" },
        "max_tokens": 1000,
        "messages": [
            {
                "role": "system",
                "content": "You are a document organisation assistant. Partition ALL provided tags into non-overlapping binder categories. The number of binders should match the natural structure of the data — typically between 4 and 25. Each binder must be semantically tight: either (a) a single organisation, company, or institution (e.g. \"Finanzamt\", \"KFW\", \"Yuh\", \"Salt\"), or (b) a single coherent life/work topic (e.g. \"Uni\", \"Rent\", \"Wohnungssuche\", \"Rente\"). NEVER merge unrelated organisations or topics into one binder just to reduce the count — it is far better to have more specific binders than to mix things that belong apart. Do not create a binder like \"Education & Transport\" or \"Finance & Housing\". Group tags only when they clearly belong to the same entity or the same narrow topic. Tags that co-occur frequently on the same documents should go in the same binder. Every input tag must appear in exactly one binder — no tag may be omitted or repeated. Use short, human-readable binder names (title-case, 1–3 words). Return a JSON object with a single key \"binders\" whose value is an array of objects each with \"name\" (string) and \"tags\" (array of strings from the input). Only valid JSON, no markdown."
            },
            {
                "role": "user",
                "content": format!("Partition these tags into binders: {}{}",
                    tag_list, cooccurrence_section)
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
