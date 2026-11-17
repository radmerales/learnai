use dioxus::prelude::*;

use crate::domain::document::MindmapNode;
use crate::domain::geometry::{HANDLE_R, Point, curve_path, side_from_vector, side_point};

use super::canvas_types::{ConnectState, EdgeDragState, MarqueeState};

#[component]
pub fn CanvasOverlays(
    nodes: Vec<MindmapNode>,
    connect: Option<ConnectState>,
    edge_drag: Option<EdgeDragState>,
    marquee: Option<MarqueeState>,
) -> Element {
    rsx! {
        if let Some(state) = connect {
            {
                let source = nodes.iter().find(|node| node.id == state.source_id);
                let start = source.map(|node| side_point(node, &state.source_side));
                let end = state
                    .target
                    .as_ref()
                    .and_then(|(id, side)| {
                        nodes
                            .iter()
                            .find(|node| &node.id == id)
                            .map(|node| side_point(node, side))
                    })
                    .unwrap_or(state.point);
                if let Some(start) = start {
                    let end_side = state
                        .target
                        .as_ref()
                        .map(|(_, side)| side.clone())
                        .unwrap_or_else(|| {
                            side_from_vector(end.x - start.x, end.y - start.y)
                        });
                    rsx! {
                        PreviewLine {
                            path: curve_path(start, &state.source_side, end, &end_side),
                            start,
                            end,
                        }
                    }
                } else {
                    rsx! {}
                }
            }
        }

        if let Some(state) = edge_drag {
            {
                let fixed = nodes.iter().find(|node| node.id == state.fixed_node_id);
                let start = fixed.map(|node| side_point(node, &state.fixed_side));
                let end = state
                    .target
                    .as_ref()
                    .and_then(|(id, side)| {
                        nodes
                            .iter()
                            .find(|node| &node.id == id)
                            .map(|node| side_point(node, side))
                    })
                    .unwrap_or(state.point);
                if let Some(start) = start {
                    let end_side = state
                        .target
                        .as_ref()
                        .map(|(_, side)| side.clone())
                        .unwrap_or_else(|| {
                            side_from_vector(end.x - start.x, end.y - start.y)
                        });
                    rsx! {
                        PreviewLine {
                            path: curve_path(start, &state.fixed_side, end, &end_side),
                            start,
                            end,
                        }
                    }
                } else {
                    rsx! {}
                }
            }
        }

        if let Some(state) = marquee {
            rect {
                x: "{state.start.x.min(state.current.x)}",
                y: "{state.start.y.min(state.current.y)}",
                width: "{(state.start.x - state.current.x).abs()}",
                height: "{(state.start.y - state.current.y).abs()}",
                fill: "#f5c518",
                fill_opacity: "0.12",
                stroke: "#3f3e3e",
                stroke_width: "1",
                pointer_events: "none",
            }
        }
    }
}

#[component]
fn PreviewLine(path: String, start: Point, end: Point) -> Element {
    rsx! {
        g { pointer_events: "none",
            path {
                d: "{path}",
                fill: "none",
                stroke: "#3f3e3e",
                stroke_width: "2.25",
                stroke_dasharray: "6 5",
            }
            circle {
                cx: "{start.x}",
                cy: "{start.y}",
                r: "{HANDLE_R}",
                fill: "#f5c518",
                stroke: "#000000",
            }
            circle {
                cx: "{end.x}",
                cy: "{end.y}",
                r: "{HANDLE_R}",
                fill: "#f5c518",
                stroke: "#000000",
            }
        }
    }
}
