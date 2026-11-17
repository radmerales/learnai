use dioxus::prelude::*;

#[component]
pub fn WorkspaceFooter(
    selected_count: usize,
    node_count: usize,
    link_count: usize,
    on_delete_selected: EventHandler<()>,
) -> Element {
    rsx! {
        footer { class: "workspace-footer",
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
                    class: "text-danger-button footer-delete",
                    onclick: move |_| on_delete_selected.call(()),
                    "Delete selected"
                }
            }
        }
    }
}
