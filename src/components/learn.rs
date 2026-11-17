use dioxus::html::{Key, ModifiersInteraction};
use dioxus::prelude::*;

use super::markdown::render_markdown;

#[component]
pub fn LearnPanel(blocks: Vec<String>, on_change: EventHandler<Vec<String>>) -> Element {
    let mut editing = use_signal(|| None::<usize>);
    let is_blank = blocks.iter().all(|block| block.trim().is_empty());
    let show_empty = is_blank && editing().is_none();
    let blocks_for_add = blocks.clone();

    let add_block = move |_| {
        let mut next = blocks_for_add.clone();
        next.push(String::new());
        editing.set(Some(next.len() - 1));
        on_change.call(next);
    };

    rsx! {
        div { class: "scroll-panel",
            if show_empty {
                button {
                    r#type: "button",
                    class: "add-empty",
                    onclick: add_block,
                    "+ Click here to add a new block"
                }
            } else {
                div { class: "stack-sm",
                    for (index, block) in blocks.iter().enumerate() {
                        {
                            let block = block.clone();
                            let editing_this = editing() == Some(index);
                            let next_blocks = blocks.clone();
                            let delete_blocks = blocks.clone();
                            rsx! {
                                if editing_this {
                                    div { key: "{index}", class: "block-editor",
                                        div { class: "block-editor-head",
                                            p { class: "eyebrow",
                                                "Editing block {index + 1}"
                                            }
                                            div { class: "block-actions",
                                                button {
                                                    r#type: "button",
                                                    class: "button-danger-small",
                                                    onclick: move |_| {
                                                        let mut updated = delete_blocks.clone();
                                                        updated.remove(index);
                                                        editing.set(None);
                                                        on_change.call(updated);
                                                    },
                                                    "Delete"
                                                }
                                                button {
                                                    r#type: "button",
                                                    class: "button-small",
                                                    onclick: move |_| editing.set(None),
                                                    "Done"
                                                }
                                            }
                                        }
                                        textarea {
                                            class: "markdown-source",
                                            "aria-label": "Markdown source",
                                            value: "{block}",
                                            oninput: move |event| {
                                                let mut updated = next_blocks.clone();
                                                if let Some(value) = updated.get_mut(index) {
                                                    *value = event.value();
                                                }
                                                on_change.call(updated);
                                            },
                                            onkeydown: move |event| {
                                                if event.key() == Key::Enter
                                                    && (event.modifiers().ctrl() || event.modifiers().meta())
                                                {
                                                    event.prevent_default();
                                                    editing.set(None);
                                                }
                                            },
                                        }
                                    }
                                } else {
                                    div {
                                        key: "{index}",
                                        class: "learn-block",
                                        ondoubleclick: move |_| editing.set(Some(index)),
                                        button {
                                            r#type: "button",
                                            class: "button-danger-small learn-delete",
                                            onclick: move |event| {
                                                event.stop_propagation();
                                                let mut updated = delete_blocks.clone();
                                                updated.remove(index);
                                                editing.set(None);
                                                on_change.call(updated);
                                            },
                                            "Delete"
                                        }
                                        div {
                                            class: "markdown markdown-block",
                                            dangerous_inner_html: render_markdown(&block),
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                div { class: "add-row",
                    button {
                        r#type: "button",
                        class: "add-row-button",
                        onclick: add_block,
                        "+ Add block"
                    }
                }
            }
        }
    }
}
