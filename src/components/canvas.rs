use dioxus::html::PointerInteraction;
use dioxus::html::input_data::MouseButton;
use dioxus::prelude::*;

use crate::domain::document::{MindmapLink, MindmapNode, Side};
use crate::domain::geometry::{
    EdgeEnd, Point, distance, edge_target, hit_test_node, nodes_in_rect, side_toward_point,
};

use super::canvas_edges::CanvasEdges;
use super::canvas_node::CanvasNode;
use super::canvas_overlays::CanvasOverlays;
use super::canvas_types::{
    ConnectOutcome, ConnectState, DragState, EdgeDragOutcome, EdgeDragState, MarqueeOutcome,
    MarqueeState, event_point, matched_side,
};

#[component]
pub fn Canvas(
    nodes: Vec<MindmapNode>,
    links: Vec<MindmapLink>,
    selected_node_ids: Vec<String>,
    selected_edge_ids: Vec<String>,
    on_select_node: EventHandler<(String, bool)>,
    on_focus_node: EventHandler<String>,
    on_select_edge: EventHandler<(String, bool)>,
    on_move_nodes: EventHandler<Vec<(String, f64, f64)>>,
    on_connect: EventHandler<ConnectOutcome>,
    on_edge_rewire: EventHandler<EdgeDragOutcome>,
    on_marquee: EventHandler<MarqueeOutcome>,
    on_create_node: EventHandler<Point>,
    on_clear_selection: EventHandler<()>,
    on_node_context_menu: EventHandler<(String, f64, f64)>,
    on_edge_context_menu: EventHandler<(String, f64, f64)>,
) -> Element {
    let mut drag = use_signal(|| None::<DragState>);
    let mut connect = use_signal(|| None::<ConnectState>);
    let mut edge_drag = use_signal(|| None::<EdgeDragState>);
    let mut marquee = use_signal(|| None::<MarqueeState>);

    let nodes_for_down = nodes.clone();
    let selected_for_down = selected_node_ids.clone();
    let nodes_for_up = nodes.clone();
    let links_for_up = links.clone();
    let nodes_for_connect_move = nodes.clone();
    let nodes_for_edge_move = nodes.clone();
    let links_for_edge_move = links.clone();
    let links_for_edge_start = links.clone();

    let on_node_down = use_callback(move |(node_id, point, additive): (String, Point, bool)| {
        let mut ids = if additive {
            selected_for_down.clone()
        } else {
            Vec::new()
        };
        if !ids.contains(&node_id) {
            ids.push(node_id.clone());
        }
        on_select_node.call((node_id.clone(), additive));
        let starts = ids
            .iter()
            .filter_map(|id| nodes_for_down.iter().find(|node| &node.id == id))
            .map(|node| (node.id.clone(), node.x, node.y))
            .collect();
        drag.set(Some(DragState {
            starts,
            start: point,
            moved: false,
            anchor_id: node_id,
        }));
    });

    let on_connect_start = move |(source_id, source_side, point): (String, Side, Point)| {
        connect.set(Some(ConnectState {
            source_id,
            source_side,
            point,
            target: None,
        }));
        drag.set(None);
        marquee.set(None);
    };

    let on_start_edge_drag = move |(edge_id, moving, point): (String, EdgeEnd, Point)| {
        let Some(link) = links_for_edge_start.iter().find(|link| link.id == edge_id) else {
            return;
        };
        let (fixed_node_id, fixed_side) = match moving {
            EdgeEnd::From => (link.to.clone(), link.to_side.clone()),
            EdgeEnd::To => (link.from_node.clone(), link.from_side.clone()),
        };
        drag.set(None);
        connect.set(None);
        marquee.set(None);
        edge_drag.set(Some(EdgeDragState {
            edge_id,
            moving,
            fixed_node_id,
            fixed_side,
            point,
            target: None,
        }));
    };

    let handles_enabled =
        drag().is_none() && connect().is_none() && edge_drag().is_none() && marquee().is_none();
    let connect_state = connect();
    let edge_drag_state = edge_drag();

    rsx! {
        svg {
            class: "h-full w-full touch-none select-none",
            onpointerdown: move |event| {
                if event.trigger_button() != Some(MouseButton::Primary) {
                    return;
                }
                let point = event_point(&event);
                marquee.set(Some(MarqueeState { start: point, current: point }));
                drag.set(None);
                connect.set(None);
                edge_drag.set(None);
            },
            onpointermove: move |event| {
                let point = event_point(&event);

                if let Some(mut state) = drag() {
                    let dx = point.x - state.start.x;
                    let dy = point.y - state.start.y;
                    state.moved = state.moved || distance(point, state.start) > 3.0;
                    let moves = state
                        .starts
                        .iter()
                        .map(|(id, x, y)| (id.clone(), x + dx, y + dy))
                        .collect();
                    on_move_nodes.call(moves);
                    drag.set(Some(state));
                    return;
                }

                if let Some(mut state) = connect() {
                    state.point = point;
                    state.target = hit_test_node(&nodes_for_connect_move, point)
                        .map(|index| &nodes_for_connect_move[index])
                        .filter(|node| node.id != state.source_id)
                        .map(|node| (node.id.clone(), side_toward_point(node, point)));
                    connect.set(Some(state));
                    return;
                }

                if let Some(mut state) = edge_drag() {
                    let target = edge_target(
                        &nodes_for_edge_move,
                        &links_for_edge_move,
                        &state.edge_id,
                        &state.fixed_node_id,
                        point,
                    );
                    state.point = point;
                    state.target = target;
                    edge_drag.set(Some(state));
                    return;
                }

                if let Some(mut state) = marquee() {
                    state.current = point;
                    marquee.set(Some(state));
                }
            },
            onpointerup: move |event| {
                let point = event_point(&event);

                if let Some(state) = drag() {
                    if !state.moved {
                        on_focus_node.call(state.anchor_id.clone());
                    }
                    drag.set(None);
                    return;
                }

                if let Some(state) = connect() {
                    let target = hit_test_node(&nodes_for_up, point)
                        .map(|index| &nodes_for_up[index])
                        .filter(|node| node.id != state.source_id)
                        .map(|node| (node.id.clone(), side_toward_point(node, point)));
                    on_connect.call(ConnectOutcome {
                        from_id: state.source_id,
                        from_side: state.source_side,
                        point,
                        target,
                    });
                    connect.set(None);
                    return;
                }

                if let Some(state) = edge_drag() {
                    let target = edge_target(
                        &nodes_for_up,
                        &links_for_up,
                        &state.edge_id,
                        &state.fixed_node_id,
                        point,
                    );
                    let over_node_id = hit_test_node(&nodes_for_up, point)
                        .map(|index| nodes_for_up[index].id.clone());
                    on_edge_rewire.call(EdgeDragOutcome {
                        edge_id: state.edge_id,
                        moving: state.moving,
                        over_node_id,
                        target,
                    });
                    edge_drag.set(None);
                    return;
                }

                if let Some(state) = marquee() {
                    let moved = (state.start.x - state.current.x).abs() > 3.0
                        || (state.start.y - state.current.y).abs() > 3.0;
                    if moved {
                        let node_ids = nodes_in_rect(&nodes_for_up, state.start, state.current);
                        on_marquee.call(MarqueeOutcome { node_ids, additive: false });
                    } else {
                        on_clear_selection.call(());
                    }
                    marquee.set(None);
                }
            },
            onpointerleave: move |_| {
                drag.set(None);
                connect.set(None);
                edge_drag.set(None);
                marquee.set(None);
            },
            ondoubleclick: move |event| {
                if event.trigger_button() == Some(MouseButton::Primary) {
                    on_create_node.call(event_point(&event));
                }
            },

            defs {
                pattern { id: "grid", width: "32", height: "32", pattern_units: "userSpaceOnUse",
                    path { d: "M 32 0 L 0 0 0 32", fill: "none", stroke: "#d8d7d3", stroke_width: "1" }
                }
            }
            rect { width: "100%", height: "100%", fill: "url(#grid)" }

            CanvasEdges {
                edges: crate::domain::geometry::render_edges(&nodes, &links),
                selected_edge_ids: selected_edge_ids.clone(),
                hidden_edge_id: edge_drag_state.as_ref().map(|state| state.edge_id.clone()),
                handles_enabled,
                on_select_edge,
                on_start_edge_drag,
                on_context_menu: on_edge_context_menu,
            }

            for node in nodes.iter() {
                {
                    let node = node.clone();
                    let selected = selected_node_ids.contains(&node.id);
                    let anchor_side = edge_drag_state
                        .as_ref()
                        .and_then(|state| matched_side(&state.target, &node.id))
                        .or_else(|| {
                            connect_state
                                .as_ref()
                                .and_then(|state| matched_side(&state.target, &node.id))
                        });
                    rsx! {
                        CanvasNode {
                            key: "{node.id}",
                            node,
                            selected,
                            connect_active: connect_state.is_some(),
                            anchor_side,
                            on_pointer_down: on_node_down,
                            on_double_click: on_focus_node,
                            on_context_menu: on_node_context_menu,
                            on_connect_start,
                        }
                    }
                }
            }

            CanvasOverlays {
                nodes: nodes.clone(),
                connect: connect_state,
                edge_drag: edge_drag_state,
                marquee: marquee(),
            }
        }
    }
}
