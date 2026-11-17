use dioxus::prelude::*;

use crate::domain::document::MindmapSummary;

#[component]
pub fn Header(
    title: String,
    maps: Vec<MindmapSummary>,
    current_id: Option<String>,
    save_status: String,
    save_error: Option<String>,
    loading: bool,
    on_title_change: EventHandler<String>,
    on_open_map: EventHandler<String>,
    on_new_map: EventHandler<()>,
    on_delete_map: EventHandler<()>,
    on_retry_save: EventHandler<()>,
) -> Element {
    let status_label = match save_status.as_str() {
        "error" => "Save failed",
        "saving" => "Saving…",
        "unsaved" => "Unsaved changes",
        _ => "Saved",
    };
    let dot_class = match save_status.as_str() {
        "error" => "save-dot is-error",
        "saved" | "idle" => "save-dot is-saved",
        _ => "save-dot is-pending",
    };

    rsx! {
        header { class: "site-header",
            div { class: "header-bar",
                div { class: "header-main",
                    div { class: "brand-row",
                        p { class: "wordmark", "learn.ai" }
                        div { class: "save-state", "aria-live": "polite",
                            span { class: "{dot_class}" }
                            span {
                                class: "save-label",
                                title: save_error.clone().unwrap_or_default(),
                                "{status_label}"
                            }
                            if save_status == "error" {
                                button {
                                    r#type: "button",
                                    class: "text-button",
                                    onclick: move |_| on_retry_save.call(()),
                                    "Retry"
                                }
                            }
                        }
                    }
                    input {
                        class: "map-title-input",
                        "aria-label": "Map title",
                        value: "{title}",
                        maxlength: 200,
                        disabled: loading,
                        placeholder: "Untitled mindmap",
                        oninput: move |event| on_title_change.call(event.value()),
                    }
                    p { class: "header-hint",
                        "Edits save automatically. Double-click a node to open its notes, or drag a side handle to connect nodes."
                    }
                }
                div { class: "header-actions",
                    label { class: "map-picker",
                        span { class: "eyebrow", "Map" }
                        select {
                            class: "map-select",
                            "aria-label": "Open mindmap",
                            value: current_id.clone().unwrap_or_default(),
                            disabled: loading || maps.is_empty(),
                            onchange: move |event| on_open_map.call(event.value()),
                            if maps.is_empty() {
                                option { value: "", "No maps" }
                            }
                            for map in maps.iter() {
                                option { key: "{map.id}", value: "{map.id}", "{map.title}" }
                            }
                        }
                    }
                    button {
                        r#type: "button",
                        class: "button button-accent",
                        disabled: loading,
                        onclick: move |_| on_new_map.call(()),
                        "New map"
                    }
                    button {
                        r#type: "button",
                        class: "button button-outline-danger",
                        disabled: loading || current_id.is_none(),
                        onclick: move |_| on_delete_map.call(()),
                        "Delete"
                    }
                }
            }
        }
    }
}
