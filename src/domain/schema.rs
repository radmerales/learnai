use schemars::schema_for;
use serde_json::{Value, json};

use super::document::MindmapResource;

pub fn build_schema() -> Value {
    let schema = schema_for!(MindmapResource);
    let mut value = serde_json::to_value(schema).unwrap_or_else(|_| json!({}));
    if let Some(object) = value.as_object_mut() {
        object.insert(
            "$schema".to_string(),
            json!("https://json-schema.org/draft/2020-12/schema"),
        );
        object.insert("title".to_string(), json!("Mindmap document (v1)"));
    }
    value
}

pub fn render_schema() -> String {
    serde_json::to_string_pretty(&build_schema()).unwrap_or_else(|_| "{}".to_string()) + "\n"
}
