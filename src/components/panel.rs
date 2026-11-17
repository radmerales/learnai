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
            class: "absolute inset-y-0 right-0 z-30 flex w-full flex-col border-l border-ink bg-paper md:w-1/2",
            "aria-label": "Node details",
            div { class: "flex items-start justify-between gap-4 border-b border-hairline px-5 py-4",
                div { class: "min-w-0 flex-1",
                    div { class: "flex flex-wrap items-center gap-3",
                        input {
                            class: "min-w-0 flex-1 border-b border-transparent bg-transparent text-2xl font-semibold leading-tight text-ink outline-none focus:border-ink",
                            "aria-label": "Node title",
                            value: "{node.label}",
                            oninput: move |event| on_title_change.call(event.value()),
                        }
                        div { role: "group", class: "inline-flex shrink-0 overflow-hidden rounded-md border border-ink",
                            for (index, status) in [NoteStatus::Todo, NoteStatus::Doing, NoteStatus::Done].iter().enumerate() {
                                {
                                    let active = node.status == *status;
                                    let style = if active { format!("background-color: {}", status.outline()) } else { String::new() };
                                    let tone = if active {
                                        "font-bold text-white"
                                    } else {
                                        "bg-surface text-mutedink hover:bg-paper hover:text-ink"
                                    };
                                    let status = status.clone();
                                    rsx! {
                                        button {
                                            key: "{index}",
                                            r#type: "button",
                                            class: "border-r border-hairline px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] last:border-r-0 {tone}",
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
                    class: "shrink-0 border border-hairline bg-paper p-2 text-ink hover:bg-surface",
                    "aria-label": "Close node panel",
                    onclick: move |_| on_close.call(()),
                    "×"
                }
            }
            div { role: "tablist", class: "flex border-b border-hairline px-5",
                button {
                    r#type: "button",
                    role: "tab",
                    class: if tab() == "learn" { "-mb-px border-b-2 border-ink px-3 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink" } else { "-mb-px border-b-2 border-transparent px-3 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink hover:text-ink" },
                    onclick: move |_| tab.set("learn"),
                    "Learn"
                }
                button {
                    r#type: "button",
                    role: "tab",
                    class: if tab() == "quiz" { "-mb-px border-b-2 border-ink px-3 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink" } else { "-mb-px border-b-2 border-transparent px-3 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink hover:text-ink" },
                    onclick: move |_| tab.set("quiz"),
                    "Quiz"
                }
            }
            div { class: "min-h-0 flex-1",
                if tab() == "learn" {
                    LearnPanel { blocks: node.learn.blocks.clone(), on_change: on_blocks_change }
                } else {
                    QuizPanel { questions: node.quiz.questions.clone(), on_change: on_questions_change }
                }
            }
            div { class: "border-t border-hairline px-5 py-2",
                button {
                    r#type: "button",
                    class: "font-mono text-[10px] uppercase tracking-[0.08em] text-red-700 underline underline-offset-4 hover:text-red-900",
                    onclick: move |_| on_delete.call(()),
                    "Delete node"
                }
            }
        }
    }
}
