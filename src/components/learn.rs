use dioxus::prelude::*;

use super::markdown::render_markdown;

#[component]
pub fn LearnPanel(blocks: Vec<String>, on_change: EventHandler<Vec<String>>) -> Element {
    let mut editing = use_signal(|| None::<usize>);
    let is_blank = blocks.iter().all(|block| block.trim().is_empty());
    let blocks_for_add = blocks.clone();

    let add_block = move |_| {
        let mut next = blocks_for_add.clone();
        next.push(String::new());
        editing.set(Some(next.len() - 1));
        on_change.call(next);
    };

    rsx! {
        div { class: "h-full overflow-y-auto px-3 py-3",
            if is_blank {
                button {
                    r#type: "button",
                    class: "flex w-full items-center justify-center gap-2 border border-hairline px-3 py-3 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink hover:border-ink hover:text-ink",
                    onclick: add_block,
                    "+ Click here to add a new block"
                }
            } else {
                div { class: "space-y-2",
                    for (index, block) in blocks.iter().enumerate() {
                        {
                            let block = block.clone();
                            let editing_this = editing() == Some(index);
                            let next_blocks = blocks.clone();
                            let delete_blocks = blocks.clone();
                            rsx! {
                                if editing_this {
                                    div { key: "{index}", class: "border border-ink bg-paper",
                                        div { class: "flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-3 py-1.5",
                                            p { class: "font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink",
                                                "Editing block {index + 1}"
                                            }
                                            div { class: "flex items-center gap-1.5",
                                                button {
                                                    r#type: "button",
                                                    class: "border border-red-700 bg-red-600 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white hover:bg-red-700",
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
                                                    class: "border border-hairline bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink hover:bg-surface hover:text-ink",
                                                    onclick: move |_| editing.set(None),
                                                    "Done"
                                                }
                                            }
                                        }
                                        textarea {
                                            class: "h-[42vh] min-h-[260px] w-full resize-y bg-surface px-4 py-3 font-mono text-sm leading-6 text-ink outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink",
                                            "aria-label": "Markdown source",
                                            value: "{block}",
                                            oninput: move |event| {
                                                let mut updated = next_blocks.clone();
                                                if let Some(value) = updated.get_mut(index) {
                                                    *value = event.value();
                                                }
                                                on_change.call(updated);
                                            },
                                        }
                                    }
                                } else {
                                    div {
                                        key: "{index}",
                                        class: "group relative border border-transparent hover:border-hairline",
                                        ondoubleclick: move |_| editing.set(Some(index)),
                                        button {
                                            r#type: "button",
                                            class: "absolute right-2 top-2 z-10 border border-red-700 bg-red-600 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-white opacity-0 hover:bg-red-700 focus-visible:opacity-100 group-hover:opacity-100",
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
                                            class: "markdown cursor-text px-3 py-2 pr-24",
                                            dangerous_inner_html: render_markdown(&block),
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                div { class: "group mt-2 border border-transparent hover:border-hairline",
                    button {
                        r#type: "button",
                        class: "flex h-10 w-full items-center justify-center px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink opacity-0 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100",
                        onclick: add_block,
                        "+ Add block"
                    }
                }
            }
        }
    }
}
