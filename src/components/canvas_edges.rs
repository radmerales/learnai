use dioxus::prelude::*;

use crate::domain::geometry::RenderedEdge;

#[component]
pub fn CanvasEdges(
    edges: Vec<RenderedEdge>,
    selected_edge_ids: Vec<String>,
    on_select_edge: EventHandler<(String, bool)>,
) -> Element {
    rsx! {
        for edge in edges.iter() {
            {
                let selected = selected_edge_ids.contains(&edge.id);
                let edge_id = edge.id.clone();
                rsx! {
                    g { key: "{edge.id}",
                        path {
                            d: "{edge.path}",
                            fill: "none",
                            stroke: if selected { "#000000" } else { "#3f3e3e" },
                            stroke_width: if selected { "3.25" } else { "2.25" },
                            stroke_linecap: "round",
                            stroke_dasharray: "6 5",
                        }
                        path {
                            d: "{edge.path}",
                            fill: "none",
                            stroke: "transparent",
                            stroke_width: "16",
                            pointer_events: "stroke",
                            class: "cursor-pointer",
                            onpointerdown: move |event| {
                                event.stop_propagation();
                                on_select_edge.call((edge_id.clone(), false));
                            },
                        }
                    }
                }
            }
        }
    }
}
