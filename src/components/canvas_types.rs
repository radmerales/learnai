use dioxus::html::InteractionElementOffset;
use dioxus::prelude::*;

use crate::domain::document::Side;
use crate::domain::geometry::{EdgeEnd, Point};

#[derive(Clone, Debug)]
pub struct ConnectOutcome {
    pub from_id: String,
    pub from_side: Side,
    pub point: Point,
    pub target: Option<(String, Side)>,
    /// True when the pointer was over a node/anchor, even if that target was
    /// invalid (the source itself or an existing link). In that case releasing
    /// must not create a new node.
    pub over_candidate: bool,
}

#[derive(Clone, Debug)]
pub struct MarqueeOutcome {
    pub node_ids: Vec<String>,
    pub additive: bool,
}

/// Result of releasing an edge endpoint drag. `over_candidate` tells the caller
/// whether the pointer was over a node or anchor, which distinguishes "cancel
/// the drag" from "drop on empty canvas and delete the edge".
#[derive(Clone, Debug)]
pub struct EdgeDragOutcome {
    pub edge_id: String,
    pub moving: EdgeEnd,
    pub over_candidate: bool,
    pub target: Option<(String, Side)>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ContextMenuRequest {
    pub target: ContextTarget,
    pub x: f64,
    pub y: f64,
}

#[derive(Clone, Debug, PartialEq)]
pub enum ContextTarget {
    Node(String),
    Edge(String),
}

#[derive(Clone, Debug)]
pub(crate) struct DragState {
    pub starts: Vec<(String, f64, f64)>,
    pub start: Point,
    pub moved: bool,
    pub anchor_id: String,
}

#[derive(Clone, Debug, PartialEq)]
pub(crate) struct ConnectState {
    pub source_id: String,
    pub source_side: Side,
    pub point: Point,
    pub candidate: Option<(String, Side)>,
    pub target: Option<(String, Side)>,
}

#[derive(Clone, Debug, PartialEq)]
pub(crate) struct EdgeDragState {
    pub edge_id: String,
    pub moving: EdgeEnd,
    pub fixed_node_id: String,
    pub fixed_side: Side,
    pub point: Point,
    pub target: Option<(String, Side)>,
}

#[derive(Clone, Debug, PartialEq)]
pub(crate) struct MarqueeState {
    pub start: Point,
    pub current: Point,
}

pub(crate) fn event_point<T: InteractionElementOffset>(event: &Event<T>) -> Point {
    let coordinates = event.data.element_coordinates();
    Point::new(coordinates.x, coordinates.y)
}

/// The side highlighted on a node when a connection or edge drag targets it.
pub(crate) fn matched_side(target: &Option<(String, Side)>, node_id: &str) -> Option<Side> {
    target
        .as_ref()
        .filter(|(id, _)| id == node_id)
        .map(|(_, side)| side.clone())
}
