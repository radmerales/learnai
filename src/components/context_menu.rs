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
            class: "menu-backdrop",
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
            class: "context-menu",
            style: "left: {left}px; top: {top}px;",
            p { class: "context-menu-label",
                "{label}"
            }
            button {
                r#type: "button",
                role: "menuitem",
                autofocus: true,
                class: "context-menu-delete",
                onkeydown: move |event| {
                    if event.key() == Key::Escape {
                        event.stop_propagation();
                        on_close.call(());
                    }
                },
                onclick: move |_| on_delete.call(()),
                svg {
                    class: "context-menu-icon",
                    "aria-hidden": "true",
                    view_box: "0 0 16 16",
                    fill: "none",
                    stroke: "currentColor",
                    stroke_width: "1.5",
                    stroke_linecap: "square",
                    path { d: "M3 4.5h10M6 4.5V3h4v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5M6.5 7v3.5M9.5 7v3.5" }
                }
                "{delete_label}"
            }
        }
    }
}
