use dioxus::html::Key;
use dioxus::prelude::*;

use crate::platform;

/// Small fixed-position menu opened by right-clicking a node or edge.
#[component]
pub fn ContextMenu(
    label: String,
    delete_label: String,
    x: f64,
    y: f64,
    on_delete: EventHandler<()>,
    on_close: EventHandler<()>,
) -> Element {
    let (viewport_width, viewport_height) = platform::viewport_size();
    let left = x.max(8.0).min((viewport_width - 216.0).max(8.0));
    let top = y.max(8.0).min((viewport_height - 112.0).max(8.0));

    rsx! {
        div {
            class: "fixed inset-0 z-40",
            "aria-hidden": "true",
            onpointerdown: move |_| on_close.call(()),
            oncontextmenu: move |event| {
                event.prevent_default();
                on_close.call(());
            },
        }
        div {
            role: "menu",
            "aria-label": "Actions for {label}",
            class: "fixed z-50 w-52 border border-ink bg-paper p-1",
            style: "left: {left}px; top: {top}px;",
            p { class: "truncate px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink",
                "{label}"
            }
            button {
                r#type: "button",
                role: "menuitem",
                autofocus: true,
                class: "flex w-full items-center gap-2 bg-red-600 px-3 py-2 text-left text-sm font-medium text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                onkeydown: move |event| {
                    if event.key() == Key::Escape {
                        event.stop_propagation();
                        on_close.call(());
                    }
                },
                onclick: move |_| on_delete.call(()),
                svg {
                    class: "h-4 w-4 shrink-0",
                    "aria-hidden": "true",
                    view_box: "0 0 16 16",
                    fill: "none",
                    stroke: "currentColor",
                    stroke_width: "1.5",
                    stroke_linecap: "round",
                    stroke_linejoin: "round",
                    path { d: "M3 4.5h10M6.5 4.5V3.25c0-.414.336-.75.75-.75h1.5c.414 0 .75.336.75.75V4.5m-6 0 .5 8.25c.027.414.37.75.786.75h4.428c.416 0 .759-.336.786-.75l.5-8.25" }
                }
                "{delete_label}"
            }
        }
    }
}
