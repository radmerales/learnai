use dioxus::html::input_data::MouseButton;
use dioxus::html::{InteractionLocation, ModifiersInteraction, PointerInteraction};
use dioxus::prelude::*;

use crate::domain::geometry::{EdgeEnd, Point, RenderedEdge};

use super::canvas_types::event_point;

#[component]
pub fn CanvasEdges(
    edges: Vec<RenderedEdge>,
    selected_edge_ids: Vec<String>,
    hidden_edge_id: Option<String>,
    handles_enabled: bool,
    on_select_edge: EventHandler<(String, bool)>,
    on_start_edge_drag: EventHandler<(String, EdgeEnd, Point)>,
    on_context_menu: EventHandler<(String, f64, f64)>,
) -> Element {
    rsx! {
        for edge in edges.iter() {
            {
                let selected = selected_edge_ids.contains(&edge.id);
                let select_id = edge.id.clone();
                let context_id = edge.id.clone();
                if hidden_edge_id.as_deref() == Some(edge.id.as_str()) {
                    rsx! {}
                } else {
                    rsx! {
                        g { key: "{edge.id}", class: "edge-group",
                            path {
                                d: "{edge.path}",
                                fill: "none",
                                stroke: if selected { "#000000" } else { "#3f3e3e" },
                                stroke_width: if selected { "3.25" } else { "2.25" },
                                stroke_linecap: "round",
                                stroke_dasharray: "6 5",
                                pointer_events: "none",
                            }
                            path {
                                d: "{edge.path}",
                                fill: "none",
                                stroke: "transparent",
                                stroke_width: "16",
                                pointer_events: "stroke",
                                class: "edge-hit",
                                onpointerdown: move |event| {
                                    event.stop_propagation();
                                    let additive = event.modifiers().shift()
                                        || event.modifiers().ctrl()
                                        || event.modifiers().meta();
                                    on_select_edge.call((select_id.clone(), additive));
                                },
                                ondoubleclick: move |event| event.stop_propagation(),
                                oncontextmenu: move |event| {
                                    event.stop_propagation();
                                    event.prevent_default();
                                    let point = event.client_coordinates();
                                    on_context_menu.call((context_id.clone(), point.x, point.y));
                                },
                            }
                            if handles_enabled {
                                EdgeHandle {
                                    edge_id: edge.id.clone(),
                                    moving: EdgeEnd::From,
                                    point: edge.from_point,
                                    on_start: on_start_edge_drag,
                                }
                                EdgeHandle {
                                    edge_id: edge.id.clone(),
                                    moving: EdgeEnd::To,
                                    point: edge.to_point,
                                    on_start: on_start_edge_drag,
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

#[component]
fn EdgeHandle(
    edge_id: String,
    moving: EdgeEnd,
    point: Point,
    on_start: EventHandler<(String, EdgeEnd, Point)>,
) -> Element {
    rsx! {
        g { class: "edge-handle",
            circle {
                cx: "{point.x}",
                cy: "{point.y}",
                r: "14",
                fill: "transparent",
                class: "handle-hit",
                onpointerdown: move |event| {
                    event.stop_propagation();
                    if event.trigger_button() != Some(MouseButton::Primary) {
                        return;
                    }
                    on_start.call((edge_id.clone(), moving, event_point(&event)));
                },
                title { "Drag to reconnect this edge" }
            }
            circle {
                cx: "{point.x}",
                cy: "{point.y}",
                r: "4.5",
                fill: "#f5c518",
                stroke: "#000000",
                stroke_width: "1",
                pointer_events: "none",
            }
        }
    }
}
