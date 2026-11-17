use dioxus::prelude::*;

use crate::domain::document::{MindmapNode, NoteStatus, QuizQuestion};

use super::learn::LearnPanel;
use super::quiz::QuizPanel;

#[component]
pub fn NodePanel(
    node: MindmapNode,
    on_title_change: EventHandler<String>,
    on_status_change: EventHandler<NoteStatus>,
    on_blocks_change: EventHandler<Vec<String>>,
    on_questions_change: EventHandler<Vec<QuizQuestion>>,
    on_close: EventHandler<()>,
    on_delete: EventHandler<()>,
) -> Element {
    let mut tab = use_signal(|| "learn");

    rsx! {
        aside {
            class: "node-panel",
            "aria-label": "Node details",
            div { class: "node-panel-header",
                div { class: "node-panel-heading",
                    div { class: "node-panel-title-row",
                        input {
                            class: "node-title-input",
                            "aria-label": "Node title",
                            value: "{node.label}",
                            oninput: move |event| on_title_change.call(event.value()),
                        }
                        div { role: "group", class: "status-group",
                            for (index, status) in [NoteStatus::Todo, NoteStatus::Doing, NoteStatus::Done].iter().enumerate() {
                                {
                                    let active = node.status == *status;
                                    let style = if active { format!("background-color: {}", status.outline()) } else { String::new() };
                                    let status = status.clone();
                                    rsx! {
                                        button {
                                            key: "{index}",
                                            r#type: "button",
                                            class: if active { "status-button is-active" } else { "status-button" },
                                            style: "{style}",
                                            onclick: move |_| on_status_change.call(status.clone()),
                                            "{status.label()}"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                button {
                    r#type: "button",
                    class: "icon-button panel-close",
                    "aria-label": "Close node panel",
                    onclick: move |_| on_close.call(()),
                    "×"
                }
            }
            div { role: "tablist", class: "panel-tabs",
                button {
                    r#type: "button",
                    role: "tab",
                    class: if tab() == "learn" { "panel-tab is-active" } else { "panel-tab" },
                    onclick: move |_| tab.set("learn"),
                    "Learn"
                }
                button {
                    r#type: "button",
                    role: "tab",
                    class: if tab() == "quiz" { "panel-tab is-active" } else { "panel-tab" },
                    onclick: move |_| tab.set("quiz"),
                    "Quiz"
                }
            }
            div { class: "panel-body",
                if tab() == "learn" {
                    LearnPanel { blocks: node.learn.blocks.clone(), on_change: on_blocks_change }
                } else {
                    QuizPanel { questions: node.quiz.questions.clone(), on_change: on_questions_change }
                }
            }
            div { class: "panel-footer",
                button {
                    r#type: "button",
                    class: "text-danger-button",
                    onclick: move |_| on_delete.call(()),
                    "Delete node"
                }
            }
        }
    }
}
