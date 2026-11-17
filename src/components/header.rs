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
        "error" => "bg-red-600",
        "saved" | "idle" => "bg-green-700",
        _ => "bg-mutedink",
    };

    rsx! {
        header { class: "border-b border-hairline bg-surface px-6 py-4",
            div { class: "flex flex-wrap items-start justify-between gap-x-6 gap-y-3",
                div { class: "min-w-0 flex-1",
                    div { class: "flex flex-wrap items-center gap-3",
                        p { class: "font-mono text-xs uppercase tracking-[0.08em] text-mutedink", "learn.ai" }
                        div { class: "flex items-center gap-2", "aria-live": "polite",
                            span { class: "h-1.5 w-1.5 {dot_class}" }
                            span {
                                class: "font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink",
                                title: save_error.clone().unwrap_or_default(),
                                "{status_label}"
                            }
                            if save_status == "error" {
                                button {
                                    r#type: "button",
                                    class: "font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink underline decoration-hairline underline-offset-4 hover:text-ink",
                                    onclick: move |_| on_retry_save.call(()),
                                    "Retry"
                                }
                            }
                        }
                    }
                    input {
                        class: "mt-1 w-full min-w-0 border-b border-transparent bg-transparent text-2xl font-semibold leading-tight text-ink outline-none placeholder:text-mutedink focus:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:opacity-60",
                        "aria-label": "Map title",
                        value: "{title}",
                        maxlength: 200,
                        disabled: loading,
                        placeholder: "Untitled mindmap",
                        oninput: move |event| on_title_change.call(event.value()),
                    }
                    p { class: "mt-1 max-w-2xl text-sm text-[#1d1d1d]",
                        "Edits save automatically. Double-click a node to open its notes, or drag a side handle to connect nodes."
                    }
                }
                div { class: "flex flex-wrap items-center gap-2",
                    label { class: "flex items-center gap-2",
                        span { class: "font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink", "Map" }
                        select {
                            class: "max-w-[14rem] border border-hairline bg-paper px-2 py-1.5 text-sm text-ink outline-none focus-visible:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60",
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
                        class: "border border-ink bg-accent px-3 py-1.5 text-sm font-medium text-accentink hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60",
                        disabled: loading,
                        onclick: move |_| on_new_map.call(()),
                        "New map"
                    }
                    button {
                        r#type: "button",
                        class: "border border-red-700 bg-paper px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:border-hairline disabled:text-mutedink disabled:hover:bg-paper",
                        disabled: loading || current_id.is_none(),
                        onclick: move |_| on_delete_map.call(()),
                        "Delete"
                    }
                }
            }
        }
    }
}
