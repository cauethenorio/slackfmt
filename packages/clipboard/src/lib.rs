#![deny(clippy::all)]

use clipboard_rs::{Clipboard, ClipboardContent, ClipboardContext};
use napi::bindgen_prelude::*;
use napi_derive::napi;

const CHROMIUM_CUSTOM_DATA: &str = "org.chromium.web-custom-data";
const SLACK_TEXTY: &str = "slack/texty";

#[napi(object)]
pub struct SlackClipboard {
    pub plain_text: Option<String>,
    pub delta_text: Option<String>,
}

/// Write Slack-formatted content to the system clipboard.
/// Encodes `delta_text` as a Chromium Pickle under `org.chromium.web-custom-data`
/// with MIME type `slack/texty`, and sets `plain_text` as the plain text fallback.
#[napi]
pub fn write_clipboard(plain_text: String, delta_text: String) -> Result<()> {
    let ctx = ClipboardContext::new()
        .map_err(|e| Error::from_reason(format!("Failed to create clipboard context: {}", e)))?;

    let pickle = encode_chromium_pickle(SLACK_TEXTY, &delta_text);

    ctx.set(vec![
        ClipboardContent::Text(plain_text),
        ClipboardContent::Other(CHROMIUM_CUSTOM_DATA.to_string(), pickle),
    ])
    .map_err(|e| Error::from_reason(format!("Failed to write to clipboard: {}", e)))?;

    Ok(())
}

/// Read Slack-formatted content from the system clipboard.
/// Returns `plain_text` and `delta_text` (decoded from `org.chromium.web-custom-data`).
#[napi]
pub fn read_clipboard() -> Result<SlackClipboard> {
    let ctx = ClipboardContext::new()
        .map_err(|e| Error::from_reason(format!("Failed to create clipboard context: {}", e)))?;

    let plain_text = ctx.get_text().ok();

    let delta_text = ctx
        .get_buffer(CHROMIUM_CUSTOM_DATA)
        .ok()
        .and_then(|data| decode_chromium_pickle(&data))
        .and_then(|entries| {
            entries
                .into_iter()
                .find(|(t, _)| t == SLACK_TEXTY)
                .map(|(_, v)| v)
        });

    Ok(SlackClipboard {
        plain_text,
        delta_text,
    })
}

// ── Chromium Pickle encoding ──────────────────────────────

/// Encode a single MIME type + value pair into Chromium Pickle format.
///
/// Binary layout:
///   u32 LE: payload size (everything after this u32)
///   u32 LE: number of entries
///   For each entry:
///     pickled_string(type_name)
///     pickled_string(value)
fn encode_chromium_pickle(mime_type: &str, value: &str) -> Vec<u8> {
    let mut payload = Vec::new();

    // Entry count: 1
    payload.extend_from_slice(&1u32.to_le_bytes());

    // Entry
    pickle_string(&mut payload, mime_type);
    pickle_string(&mut payload, value);

    // Header + payload
    let mut result = Vec::with_capacity(4 + payload.len());
    result.extend_from_slice(&(payload.len() as u32).to_le_bytes());
    result.extend(payload);

    result
}

/// Encode a string in Chromium Pickle format:
///   u32 LE: character count (UTF-16 code units)
///   UTF-16LE encoded bytes
///   padding to 4-byte alignment
fn pickle_string(buf: &mut Vec<u8>, s: &str) {
    let utf16: Vec<u16> = s.encode_utf16().collect();
    buf.extend_from_slice(&(utf16.len() as u32).to_le_bytes());

    for code_unit in &utf16 {
        buf.extend_from_slice(&code_unit.to_le_bytes());
    }

    let byte_len = utf16.len() * 2;
    let padding = (4 - (byte_len % 4)) % 4;
    buf.extend(std::iter::repeat(0u8).take(padding));
}

// ── Chromium Pickle decoding ──────────────────────────────

fn decode_chromium_pickle(data: &[u8]) -> Option<Vec<(String, String)>> {
    if data.len() < 8 {
        return None;
    }

    let payload_size = u32::from_le_bytes(data[0..4].try_into().ok()?) as usize;
    let payload = data.get(4..4 + payload_size)?;

    let count = u32::from_le_bytes(payload.get(0..4)?.try_into().ok()?) as usize;
    let mut offset = 4;
    let mut entries = Vec::with_capacity(count);

    for _ in 0..count {
        let (type_name, next) = unpickle_string(payload, offset)?;
        let (value, next) = unpickle_string(payload, next)?;
        entries.push((type_name, value));
        offset = next;
    }

    Some(entries)
}

fn unpickle_string(data: &[u8], offset: usize) -> Option<(String, usize)> {
    let end = offset + 4;
    let char_count = u32::from_le_bytes(data.get(offset..end)?.try_into().ok()?) as usize;
    let byte_count = char_count * 2;
    let start = end;

    let utf16: Vec<u16> = (0..char_count)
        .map(|i| {
            let pos = start + i * 2;
            u16::from_le_bytes(data[pos..pos + 2].try_into().unwrap())
        })
        .collect();

    let s = String::from_utf16(&utf16).ok()?;
    let padding = (4 - (byte_count % 4)) % 4;
    Some((s, start + byte_count + padding))
}
