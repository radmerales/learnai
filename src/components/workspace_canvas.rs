use dioxus::prelude::*;

use crate::domain::document::{MindmapLink, MindmapNode};
use crate::domain::geometry::{Point, opposite_side};
use crate::state::{GraphState, Selection};

use super::canvas::Canvas;
use super::canvas_types::{
    ConnectOutcome, ContextMenuRequest, ContextTarget, EdgeDragOutcome, MarqueeOutcome,
};
use super::context_menu::ContextMenu;

/// Connects the presentational canvas to graph/selection state and hosts the
/// right-click menu. Keeping this wiring out of `App` leaves the app component
/// focused on loading, autosave, and layout.
#[component]
pub fn WorkspaceCanvas(
    nodes: Vec<MindmapNode>,
    links: Vec<MindmapLink>,
    selected_node_ids: Vec<String>,
    selected_edge_ids: Vec<String>,
    graph: Signal<GraphState>,
    selection: Signal<Selection>,
) -> Element {
    let mut menu = use_signal(|| None::<ContextMenuRequest>);

    let on_select_node = move |(id, additive): (String, bool)| {
        selection.write().select_node(id, additive);
    };
    let on_focus_node = move |id: String| selection.write().focus_node(id);
    let on_select_edge = move |(id, additive): (String, bool)| {
        selection.write().select_edge(id, additive);
    };
    let on_move_nodes = move |moves: Vec<(String, f64, f64)>| graph.write().move_nodes(&moves);
    let on_connect = move |outcome: ConnectOutcome| {
        let mut state = graph.write();
        if let Some((target_id, target_side)) = outcome.target {
            state.add_link(&outcome.from_id, &target_id, outcome.from_side, target_side);
        } else if !outcome.over_candidate {
            let node = state.add_node_at(outcome.point.x, outcome.point.y);
            let to_side = opposite_side(&outcome.from_side);
            state.add_link(&outcome.from_id, &node.id, outcome.from_side, to_side);
            drop(state);
            selection.write().focus_node(node.id);
        }
    };
    let on_edge_rewire = move |outcome: EdgeDragOutcome| {
        let mut state = graph.write();
        if let Some((node_id, side)) = outcome.target {
            state.rewire_link(&outcome.edge_id, outcome.moving, &node_id, side);
        } else if !outcome.over_candidate {
            state.remove_link(&outcome.edge_id);
        }
        drop(state);
        selection.write().clear();
    };
    let on_create_node = move |point: Point| {
        let node = graph.write().add_node_at(point.x, point.y);
        selection.write().focus_node(node.id);
    };
    let on_marquee = move |outcome: MarqueeOutcome| {
        selection
            .write()
            .select_marquee(outcome.node_ids, Vec::new(), outcome.additive);
    };
    let on_clear_selection = move |_| selection.write().clear();
    let on_node_context_menu = move |(id, x, y): (String, f64, f64)| {
        {
            let mut current = selection.write();
            current.select_node(id.clone(), false);
            current.close_panel();
        }
        menu.set(Some(ContextMenuRequest {
            target: ContextTarget::Node(id),
            x,
            y,
        }));
    };
    let on_edge_context_menu = move |(id, x, y): (String, f64, f64)| {
        selection.write().select_edge(id.clone(), false);
        menu.set(Some(ContextMenuRequest {
            target: ContextTarget::Edge(id),
            x,
            y,
        }));
    };

    let menu_details = menu().map(|request| {
        let (label, delete_label) = context_label(&request.target, &nodes, &links);
        (request, label, delete_label)
    });

    rsx! {
        Canvas {
            nodes,
            links,
            selected_node_ids,
            selected_edge_ids,
            on_select_node,
            on_focus_node,
            on_select_edge,
            on_move_nodes,
            on_connect,
            on_edge_rewire,
            on_marquee,
            on_create_node,
            on_clear_selection,
            on_node_context_menu,
            on_edge_context_menu,
        }

        if let Some((request, label, delete_label)) = menu_details {
            ContextMenu {
                label,
                delete_label,
                x: request.x,
                y: request.y,
                on_close: move |_| menu.set(None),
                on_delete: move |_| {
                    if let Some(request) = menu() {
                        let mut state = graph.write();
                        match &request.target {
                            ContextTarget::Node(id) => state.remove_node(id),
                            ContextTarget::Edge(id) => state.remove_link(id),
                        }
                        drop(state);
                        selection.write().clear();
                    }
                    menu.set(None);
                },
            }
        }
    }
}

fn context_label(
    target: &ContextTarget,
    nodes: &[MindmapNode],
    links: &[MindmapLink],
) -> (String, &'static str) {
    match target {
        ContextTarget::Node(id) => (node_label(id, nodes), "Delete node"),
        ContextTarget::Edge(id) => {
            let label = links
                .iter()
                .find(|link| &link.id == id)
                .map(|link| {
                    format!(
                        "{} → {}",
                        node_label(&link.from_node, nodes),
                        node_label(&link.to, nodes)
                    )
                })
                .unwrap_or_else(|| "Edge".to_string());
            (label, "Delete edge")
        }
    }
}

fn node_label(id: &str, nodes: &[MindmapNode]) -> String {
    nodes
        .iter()
        .find(|node| node.id == id)
        .map(|node| node.label.trim())
        .filter(|label| !label.is_empty())
        .map(|label| label.to_string())
        .unwrap_or_else(|| "Untitled node".to_string())
}
