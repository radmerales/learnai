use dioxus::prelude::*;

use crate::app_actions::{
    PanelHost, apply_resource, delete_map_handler, document_json, load_initial, new_map_handler,
    open_map_handler, retry_save_handler, summary_from, title_change_handler,
};
use crate::components::header::Header;
use crate::components::workspace_canvas::WorkspaceCanvas;
use crate::components::workspace_footer::WorkspaceFooter;
use crate::domain::document::MindmapSummary;
use crate::platform;
use crate::server::save_mindmap;
use crate::state::{GraphState, Selection};

#[component]
pub fn App() -> Element {
    let mut maps = use_signal(Vec::<MindmapSummary>::new);
    let current_id = use_signal(|| None::<String>);
    let title = use_signal(|| "Untitled mindmap".to_string());
    let mut graph = use_signal(GraphState::default);
    let mut selection = use_signal(Selection::default);
    let mut loading = use_signal(|| true);
    let mut load_error = use_signal(|| None::<String>);
    let mut save_status = use_signal(|| "idle".to_string());
    let mut save_error = use_signal(|| None::<String>);
    let mut last_saved = use_signal(String::new);
    let mut latest_json = use_signal(String::new);

    use_future(move || async move {
        match load_initial().await {
            Ok((list, resource)) => {
                maps.set(list);
                apply_resource(
                    resource,
                    graph,
                    title,
                    current_id,
                    last_saved,
                    selection,
                    maps,
                    save_status,
                );
                loading.set(false);
            }
            Err(error) => {
                load_error.set(Some(error.to_string()));
                loading.set(false);
            }
        }
    });

    use_effect(move || {
        if loading() {
            return;
        }
        let Some(id) = current_id() else {
            return;
        };
        let document = graph().document(title());
        let json = document_json(&document);
        if json == last_saved() {
            return;
        }

        latest_json.set(json.clone());
        save_status.set("unsaved".to_string());
        save_error.set(None);
        let json_for_task = json.clone();
        spawn(async move {
            platform::sleep_ms(800).await;
            if latest_json() != json_for_task {
                return;
            }
            save_status.set("saving".to_string());
            match save_mindmap(id.clone(), document).await {
                Ok(resource) => {
                    last_saved.set(json_for_task);
                    save_status.set("saved".to_string());
                    save_error.set(None);
                    let summary = summary_from(&resource);
                    let mut list = maps();
                    if let Some(existing) = list.iter_mut().find(|item| item.id == summary.id) {
                        *existing = summary;
                        maps.set(list);
                    }
                }
                Err(error) => {
                    save_status.set("error".to_string());
                    save_error.set(Some(error.to_string()));
                }
            }
        });
    });

    let selected_count = selection.read().node_ids.len() + selection.read().edge_ids.len();
    let panel_node = {
        let current = selection.read();
        if current.panel_open {
            current.single_node().and_then(|id| {
                graph
                    .read()
                    .nodes
                    .iter()
                    .find(|node| node.id == id)
                    .cloned()
            })
        } else {
            None
        }
    };

    let on_title_change = title_change_handler(title, current_id, maps);
    let on_open_map = open_map_handler(
        loading,
        load_error,
        current_id,
        graph,
        title,
        last_saved,
        selection,
        maps,
        save_status,
    );
    let on_new_map = new_map_handler(
        loading,
        load_error,
        current_id,
        graph,
        title,
        last_saved,
        selection,
        maps,
        save_status,
    );
    let on_delete_map = delete_map_handler(
        loading,
        load_error,
        current_id,
        graph,
        title,
        last_saved,
        selection,
        maps,
        save_status,
    );
    let on_retry_save = retry_save_handler(
        current_id,
        graph,
        title,
        last_saved,
        save_status,
        save_error,
    );

    let delete_selection = move |_| {
        let (nodes, edges) = {
            let current = selection.read();
            (current.node_ids.clone(), current.edge_ids.clone())
        };
        let mut state = graph.write();
        for id in &edges {
            state.remove_link(id);
        }
        for id in &nodes {
            state.remove_node(id);
        }
        drop(state);
        selection.write().clear();
    };

    let loading_value = loading();
    let load_error_value = load_error();

    rsx! {
        document::Link {
            rel: "stylesheet",
            href: "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css",
        }
        div { class: "app-shell",
            Header {
                title: title(),
                maps: maps(),
                current_id: current_id(),
                save_status: save_status(),
                save_error: save_error(),
                loading: loading_value,
                on_title_change,
                on_open_map,
                on_new_map,
                on_delete_map,
                on_retry_save,
            }

            div { class: "workspace",
                WorkspaceCanvas {
                    nodes: graph().nodes,
                    links: graph().links,
                    selected_node_ids: selection.read().node_ids.clone(),
                    selected_edge_ids: selection.read().edge_ids.clone(),
                    graph,
                    selection,
                }

                if let Some(node) = panel_node.clone() {
                    PanelHost { node, graph, selection }
                }

                if loading_value {
                    div { class: "overlay",
                        div { class: "overlay-card",
                            p { class: "overlay-title", "Loading map" }
                            p { class: "overlay-status", "Fetching nodes, notes, and questions…" }
                        }
                    }
                } else if let Some(error) = load_error_value {
                    div { class: "overlay",
                        div { class: "overlay-card",
                            p { class: "overlay-title", "Could not load map" }
                            p { class: "overlay-copy", "{error}" }
                        }
                    }
                } else if graph().nodes.is_empty() {
                    div { class: "overlay",
                        div { class: "overlay-card",
                            p { class: "overlay-title", "Empty canvas" }
                            p { class: "overlay-copy",
                                "Start with one node, then drag from its edge handles to grow the map."
                            }
                            button {
                                r#type: "button",
                                class: "button button-accent overlay-action",
                                onclick: move |_| {
                                    let node = graph.write().add_node_at(420.0, 260.0);
                                    selection.write().focus_node(node.id);
                                },
                                "Create first node"
                            }
                        }
                    }
                }
            }

            WorkspaceFooter {
                selected_count,
                node_count: graph().nodes.len(),
                link_count: graph().links.len(),
                on_delete_selected: delete_selection,
            }
        }
    }
}
