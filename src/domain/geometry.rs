use super::document::{MindmapLink, MindmapNode, Side};

pub const NODE_H: f64 = 44.0;
pub const HANDLE_R: f64 = 4.5;
pub const ANCHOR_OFFSET: f64 = 10.0;
pub const SIDES: [Side; 4] = [Side::Top, Side::Right, Side::Bottom, Side::Left];

#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

impl Point {
    pub fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct RenderedEdge {
    pub id: String,
    pub from_id: String,
    pub to_id: String,
    pub from_point: Point,
    pub to_point: Point,
    pub path: String,
}

/// Which end of an existing edge the user is dragging.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EdgeEnd {
    From,
    To,
}

pub fn side_point(node: &MindmapNode, side: &Side) -> Point {
    match side {
        Side::Top => Point::new(node.x, node.y - NODE_H / 2.0 - ANCHOR_OFFSET),
        Side::Right => Point::new(node.x + node.width / 2.0 + ANCHOR_OFFSET, node.y),
        Side::Bottom => Point::new(node.x, node.y + NODE_H / 2.0 + ANCHOR_OFFSET),
        Side::Left => Point::new(node.x - node.width / 2.0 - ANCHOR_OFFSET, node.y),
    }
}

pub fn local_handle_point(width: f64, side: &Side) -> Point {
    match side {
        Side::Top => Point::new(width / 2.0, -ANCHOR_OFFSET),
        Side::Right => Point::new(width + ANCHOR_OFFSET, NODE_H / 2.0),
        Side::Bottom => Point::new(width / 2.0, NODE_H + ANCHOR_OFFSET),
        Side::Left => Point::new(-ANCHOR_OFFSET, NODE_H / 2.0),
    }
}

pub fn hit_test_node(nodes: &[MindmapNode], point: Point) -> Option<usize> {
    nodes.iter().enumerate().rev().find_map(|(index, node)| {
        ((point.x - node.x).abs() <= node.width / 2.0 && (point.y - node.y).abs() <= NODE_H / 2.0)
            .then_some(index)
    })
}

pub fn side_toward_point(node: &MindmapNode, point: Point) -> Side {
    let dx = (point.x - node.x) / (node.width / 2.0);
    let dy = (point.y - node.y) / (NODE_H / 2.0);
    if dx.abs() >= dy.abs() {
        if dx >= 0.0 { Side::Right } else { Side::Left }
    } else if dy >= 0.0 {
        Side::Bottom
    } else {
        Side::Top
    }
}

pub fn side_from_vector(dx: f64, dy: f64) -> Side {
    if dx.abs() >= dy.abs() {
        if dx >= 0.0 { Side::Right } else { Side::Left }
    } else if dy >= 0.0 {
        Side::Bottom
    } else {
        Side::Top
    }
}

pub fn opposite_side(side: &Side) -> Side {
    match side {
        Side::Top => Side::Bottom,
        Side::Right => Side::Left,
        Side::Bottom => Side::Top,
        Side::Left => Side::Right,
    }
}

/// True when an undirected edge already joins the two nodes. Rewiring and
/// connecting both use this to keep the graph free of duplicate links.
pub fn edge_exists_between(
    links: &[MindmapLink],
    a: &str,
    b: &str,
    ignore_id: Option<&str>,
) -> bool {
    links.iter().any(|link| {
        ignore_id != Some(link.id.as_str())
            && ((link.from_node == a && link.to == b) || (link.from_node == b && link.to == a))
    })
}

/// Resolve the node under the pointer as the new endpoint of an existing edge.
///
/// `fixed_node_id` is the endpoint that is *not* moving. Releasing over that
/// node, the other endpoint, or a node that already has an edge to the other
/// endpoint is not a valid move.
pub fn edge_target(
    nodes: &[MindmapNode],
    links: &[MindmapLink],
    edge_id: &str,
    fixed_node_id: &str,
    point: Point,
) -> Option<(String, Side)> {
    let link = links.iter().find(|link| link.id == edge_id)?;
    let index = hit_test_node(nodes, point)?;
    let hit = &nodes[index];
    if hit.id == fixed_node_id {
        return None;
    }

    let other_end = if link.from_node == fixed_node_id {
        &link.to
    } else if link.to == fixed_node_id {
        &link.from_node
    } else {
        return None;
    };
    if hit.id == *other_end || edge_exists_between(links, other_end, &hit.id, Some(edge_id)) {
        return None;
    }

    Some((hit.id.clone(), side_toward_point(hit, point)))
}

pub fn curve_path(from: Point, from_side: &Side, to: Point, to_side: &Side) -> String {
    let distance = ((to.x - from.x).powi(2) + (to.y - from.y).powi(2)).sqrt();
    let bend = (distance * 0.45).clamp(36.0, 170.0);
    let n1 = side_normal(from_side);
    let n2 = side_normal(to_side);
    let c1 = Point::new(from.x + n1.x * bend, from.y + n1.y * bend);
    let c2 = Point::new(to.x + n2.x * bend, to.y + n2.y * bend);
    format!(
        "M {} {} C {} {}, {} {}, {} {}",
        round(from.x),
        round(from.y),
        round(c1.x),
        round(c1.y),
        round(c2.x),
        round(c2.y),
        round(to.x),
        round(to.y)
    )
}

fn round(value: f64) -> f64 {
    (value * 100.0).round() / 100.0
}

fn side_normal(side: &Side) -> Point {
    match side {
        Side::Top => Point::new(0.0, -1.0),
        Side::Right => Point::new(1.0, 0.0),
        Side::Bottom => Point::new(0.0, 1.0),
        Side::Left => Point::new(-1.0, 0.0),
    }
}

pub fn render_edge(link: &MindmapLink, from: &MindmapNode, to: &MindmapNode) -> RenderedEdge {
    let from_point = side_point(from, &link.from_side);
    let to_point = side_point(to, &link.to_side);
    RenderedEdge {
        id: link.id.clone(),
        from_id: link.from_node.clone(),
        to_id: link.to.clone(),
        from_point,
        to_point,
        path: curve_path(from_point, &link.from_side, to_point, &link.to_side),
    }
}

pub fn render_edges(nodes: &[MindmapNode], links: &[MindmapLink]) -> Vec<RenderedEdge> {
    links
        .iter()
        .filter_map(|link| {
            let from = nodes.iter().find(|node| node.id == link.from_node)?;
            let to = nodes.iter().find(|node| node.id == link.to)?;
            Some(render_edge(link, from, to))
        })
        .collect()
}

pub fn distance(a: Point, b: Point) -> f64 {
    ((a.x - b.x).powi(2) + (a.y - b.y).powi(2)).sqrt()
}

/// IDs of nodes touched by the marquee rectangle between two drag points.
pub fn nodes_in_rect(nodes: &[MindmapNode], start: Point, current: Point) -> Vec<String> {
    let min_x = start.x.min(current.x);
    let max_x = start.x.max(current.x);
    let min_y = start.y.min(current.y);
    let max_y = start.y.max(current.y);

    nodes
        .iter()
        .filter(|node| {
            node.x + node.width / 2.0 >= min_x
                && node.x - node.width / 2.0 <= max_x
                && node.y + NODE_H / 2.0 >= min_y
                && node.y - NODE_H / 2.0 <= max_y
        })
        .map(|node| node.id.clone())
        .collect()
}
