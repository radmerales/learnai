use dioxus::html::InteractionElementOffset;
use dioxus::prelude::*;

use crate::domain::document::Side;
use crate::domain::geometry::Point;

#[derive(Clone, Debug)]
pub struct ConnectOutcome {
    pub from_id: String,
    pub from_side: Side,
    pub point: Point,
    pub target: Option<(String, Side)>,
}

#[derive(Clone, Debug)]
pub struct MarqueeOutcome {
    pub node_ids: Vec<String>,
    pub additive: bool,
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
