use dioxus::html::input_data::MouseButton;
use dioxus::html::{ModifiersInteraction, PointerInteraction};
use dioxus::prelude::*;

use crate::domain::document::{MindmapLink, MindmapNode};
use crate::domain::geometry::{NODE_H, Point, SIDES, distance, hit_test_node, side_toward_point};

use super::canvas_edges::CanvasEdges;
use super::canvas_overlays::CanvasOverlays;
use super::canvas_types::{
    ConnectOutcome, ConnectState, DragState, MarqueeOutcome, MarqueeState, event_point,
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
    on_marquee: EventHandler<MarqueeOutcome>,
    on_create_node: EventHandler<Point>,
    on_clear_selection: EventHandler<()>,
) -> Element {
    let mut drag = use_signal(|| None::<DragState>);
    let mut connect = use_signal(|| None::<ConnectState>);
    let mut marquee = use_signal(|| None::<MarqueeState>);
    let mut hovered = use_signal(|| None::<String>);
    let nodes_for_down = nodes.clone();
    let selected_for_down = selected_node_ids.clone();
    let nodes_for_up = nodes.clone();
    let nodes_for_connect_move = nodes.clone();

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

                if let Some(state) = marquee() {
                    let min_x = state.start.x.min(state.current.x);
                    let max_x = state.start.x.max(state.current.x);
                    let min_y = state.start.y.min(state.current.y);
                    let max_y = state.start.y.max(state.current.y);
                    let moved = (max_x - min_x) > 3.0 || (max_y - min_y) > 3.0;
                    if moved {
                        let ids = nodes_for_up
                            .iter()
                            .filter(|node| {
                                node.x + node.width / 2.0 >= min_x
                                    && node.x - node.width / 2.0 <= max_x
                                    && node.y + NODE_H / 2.0 >= min_y
                                    && node.y - NODE_H / 2.0 <= max_y
                            })
                            .map(|node| node.id.clone())
                            .collect();
                        on_marquee.call(MarqueeOutcome { node_ids: ids, additive: false });
                    } else {
                        on_clear_selection.call(());
                    }
                    marquee.set(None);
                }
            },
            onpointerleave: move |_| {
                drag.set(None);
                connect.set(None);
                marquee.set(None);
                hovered.set(None);
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
                on_select_edge,
            }

            for node in nodes.iter() {
                {
                    let node = node.clone();
                    let selected = selected_node_ids.contains(&node.id);
                    let hovered_this = hovered() == Some(node.id.clone());
                    let starts = nodes_for_down.clone();
                    let node_id = node.id.clone();
                    let node_id_copy = node.id.clone();
                    let selected_snapshot = selected_for_down.clone();
                    let node_for_connect = node.clone();
                    rsx! {
                        g {
                            key: "{node.id}",
                            transform: "translate({node.x - node.width / 2.0}, {node.y - NODE_H / 2.0})",
                            class: "cursor-grab",
                            onpointerenter: move |_| hovered.set(Some(node_id.clone())),
                            onpointerleave: move |_| hovered.set(None),
                            onpointerdown: move |event| {
                                event.stop_propagation();
                                if event.trigger_button() != Some(MouseButton::Primary) {
                                    return;
                                }
                                let additive = event.modifiers().shift()
                                    || event.modifiers().ctrl()
                                    || event.modifiers().meta();
                                let mut ids = if additive { selected_snapshot.clone() } else { Vec::new() };
                                if !ids.contains(&node_id_copy) {
                                    ids.push(node_id_copy.clone());
                                }
                                on_select_node.call((node_id_copy.clone(), additive));
                                let starts = ids
                                    .iter()
                                    .filter_map(|id| starts.iter().find(|node| &node.id == id))
                                    .map(|node| (node.id.clone(), node.x, node.y))
                                    .collect();
                                drag.set(Some(DragState {
                                    starts,
                                    start: event_point(&event),
                                    moved: false,
                                    anchor_id: node_id_copy.clone(),
                                }));
                            },
                            ondoubleclick: move |event| {
                                event.stop_propagation();
                                on_focus_node.call(node.id.clone());
                            },

                            rect {
                                width: "{node.width}",
                                height: "{NODE_H}",
                                fill: node.status.background(),
                                stroke: node.status.outline(),
                                stroke_width: if selected { "4.5" } else { "1.5" },
                            }
                            text {
                                x: "{node.width / 2.0}",
                                y: "{NODE_H / 2.0 + 5.0}",
                                text_anchor: "middle",
                                font_size: "14",
                                font_family: "IBM Plex Sans, sans-serif",
                                fill: node.status.text(),
                                "{node.label}"
                            }

                            if hovered_this || connect().is_some() {
                                for (index, side) in SIDES.iter().enumerate() {
                                    {
                                        let point = crate::domain::geometry::local_handle_point(node.width, side);
                                        rsx! {
                                            circle {
                                                key: "{index}",
                                                cx: "{point.x}",
                                                cy: "{point.y}",
                                                r: "4.5",
                                                fill: node.status.outline(),
                                                stroke: node.status.outline(),
                                                stroke_width: "1",
                                                pointer_events: "none",
                                            }
                                        }
                                    }
                                }
                            }

                            for (index, side) in SIDES.iter().enumerate() {
                                {
                                    let point = crate::domain::geometry::local_handle_point(node.width, side);
                                    let source_id = node_for_connect.id.clone();
                                    let source_side = side.clone();
                                    rsx! {
                                        circle {
                                            key: "hit-{index}",
                                            cx: "{point.x}",
                                            cy: "{point.y}",
                                            r: "14",
                                            fill: "transparent",
                                            class: "cursor-crosshair",
                                            onpointerdown: move |event| {
                                                event.stop_propagation();
                                                connect.set(Some(ConnectState {
                                                    source_id: source_id.clone(),
                                                    source_side: source_side.clone(),
                                                    point: event_point(&event),
                                                    target: None,
                                                }));
                                                drag.set(None);
                                                marquee.set(None);
                                            },
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            CanvasOverlays { nodes: nodes.clone(), connect: connect(), marquee: marquee() }
        }
    }
}
