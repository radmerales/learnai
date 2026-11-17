use dioxus::prelude::*;

#[component]
pub fn WorkspaceFooter(
    selected_count: usize,
    node_count: usize,
    link_count: usize,
    on_delete_selected: EventHandler<()>,
) -> Element {
    rsx! {
        footer { class: "flex items-center justify-between gap-4 border-t border-hairline bg-surface px-6 py-2 font-mono text-xs text-mutedink",
            span {
                if selected_count > 0 {
                    "{selected_count} selected"
                } else {
                    "{node_count} nodes · {link_count} links"
                }
            }
            if selected_count > 0 {
                button {
                    r#type: "button",
                    class: "text-red-700 underline underline-offset-4 hover:text-red-900",
                    onclick: move |_| on_delete_selected.call(()),
                    "Delete selected"
                }
            }
        }
    }
}
