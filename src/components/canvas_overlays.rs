use dioxus::prelude::*;

use crate::domain::document::{MindmapNode, Side};
use crate::domain::geometry::{HANDLE_R, curve_path, side_point};

use super::canvas_types::{ConnectState, MarqueeState};

#[component]
pub fn CanvasOverlays(
    nodes: Vec<MindmapNode>,
    connect: Option<ConnectState>,
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
                        .unwrap_or(Side::Left);
                    rsx! {
                        g { pointer_events: "none",
                            path {
                                d: curve_path(start, &state.source_side, end, &end_side),
                                fill: "none",
                                stroke: "#3f3e3e",
                                stroke_width: "2.25",
                                stroke_dasharray: "6 5",
                            }
                            circle { cx: "{start.x}", cy: "{start.y}", r: "{HANDLE_R}", fill: "#f5c518", stroke: "#000000" }
                            circle { cx: "{end.x}", cy: "{end.y}", r: "{HANDLE_R}", fill: "#f5c518", stroke: "#000000" }
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
