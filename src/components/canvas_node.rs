use dioxus::html::input_data::MouseButton;
use dioxus::html::{InteractionLocation, ModifiersInteraction, PointerInteraction};
use dioxus::prelude::*;

use crate::domain::document::{MindmapNode, Side};
use crate::domain::geometry::{NODE_H, Point, SIDES, local_handle_point};

use super::canvas_types::event_point;

/// A single node on the SVG canvas. Keeping the markup separate from the
/// interaction coordinator makes the drag/connect logic in `canvas.rs` easier
/// to follow.
#[component]
pub fn CanvasNode(
    node: MindmapNode,
    selected: bool,
    connect_active: bool,
    anchor_side: Option<Side>,
    on_pointer_down: EventHandler<(String, Point, bool)>,
    on_double_click: EventHandler<String>,
    on_context_menu: EventHandler<(String, f64, f64)>,
    on_connect_start: EventHandler<(String, Side, Point)>,
) -> Element {
    let mut hovered = use_signal(|| false);
    let show_handles = hovered() || connect_active || anchor_side.is_some();

    let down_id = node.id.clone();
    let double_click_id = node.id.clone();
    let context_id = node.id.clone();

    rsx! {
        g {
            transform: "translate({node.x - node.width / 2.0}, {node.y - NODE_H / 2.0})",
            class: "cursor-grab",
            onpointerenter: move |_| hovered.set(true),
            onpointerleave: move |_| hovered.set(false),
            onpointerdown: move |event| {
                event.stop_propagation();
                if event.trigger_button() != Some(MouseButton::Primary) {
                    return;
                }
                let additive = event.modifiers().shift()
                    || event.modifiers().ctrl()
                    || event.modifiers().meta();
                on_pointer_down.call((down_id.clone(), event_point(&event), additive));
            },
            ondoubleclick: move |event| {
                event.stop_propagation();
                on_double_click.call(double_click_id.clone());
            },
            oncontextmenu: move |event| {
                event.stop_propagation();
                event.prevent_default();
                let point = event.client_coordinates();
                on_context_menu.call((context_id.clone(), point.x, point.y));
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

            if show_handles {
                for (index, side) in SIDES.iter().enumerate() {
                    {
                        let point = local_handle_point(node.width, side);
                        let source_id = node.id.clone();
                        let source_side = side.clone();
                        rsx! {
                            g { key: "{index}",
                                if anchor_side.as_ref() == Some(side) {
                                    circle {
                                        cx: "{point.x}",
                                        cy: "{point.y}",
                                        r: "7",
                                        fill: "#f5c518",
                                        stroke: "#000000",
                                        stroke_width: "1.5",
                                        pointer_events: "none",
                                    }
                                }
                                circle {
                                    cx: "{point.x}",
                                    cy: "{point.y}",
                                    r: "14",
                                    fill: "transparent",
                                    class: "cursor-crosshair",
                                    onpointerdown: move |event| {
                                        event.stop_propagation();
                                        if event.trigger_button() != Some(MouseButton::Primary) {
                                            return;
                                        }
                                        on_connect_start.call((
                                            source_id.clone(),
                                            source_side.clone(),
                                            event_point(&event),
                                        ));
                                    },
                                }
                                circle {
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
            }
        }
    }
}
