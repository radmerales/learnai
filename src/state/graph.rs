use crate::domain::document::{
    LearnContent, MindmapDocument, MindmapLink, MindmapNode, MindmapResource, NoteStatus,
    QuizContent, QuizQuestion, Side,
};
use crate::domain::geometry::{EdgeEnd, edge_exists_between};
use crate::domain::quiz::{measure_node_width, new_node};

#[derive(Clone, Debug, Default)]
pub struct GraphState {
    pub nodes: Vec<MindmapNode>,
    pub links: Vec<MindmapLink>,
}

impl GraphState {
    pub fn from_resource(resource: &MindmapResource) -> Self {
        Self {
            nodes: resource.document.nodes.clone(),
            links: resource.document.links.clone(),
        }
    }

    pub fn document(&self, title: impl Into<String>) -> MindmapDocument {
        MindmapDocument {
            schema_version: 1,
            title: title.into(),
            nodes: self.nodes.clone(),
            links: self.links.clone(),
        }
    }

    pub fn next_label(&self) -> String {
        let next = self
            .nodes
            .iter()
            .filter_map(|node| node.label.strip_prefix("Node "))
            .filter_map(|number| number.parse::<usize>().ok())
            .max()
            .unwrap_or(0)
            + 1;
        format!("Node {next}")
    }

    pub fn add_node_at(&mut self, x: f64, y: f64) -> MindmapNode {
        let node = new_node(x, y, self.next_label());
        self.nodes.push(node.clone());
        node
    }

    pub fn remove_node(&mut self, id: &str) {
        self.nodes.retain(|node| node.id != id);
        self.links
            .retain(|link| link.from_node != id && link.to != id);
    }

    pub fn rename_node(&mut self, id: &str, label: String) {
        if let Some(node) = self.nodes.iter_mut().find(|node| node.id == id) {
            node.width = measure_node_width(&label);
            node.label = label;
        }
    }

    pub fn set_blocks(&mut self, id: &str, blocks: Vec<String>) {
        if let Some(node) = self.nodes.iter_mut().find(|node| node.id == id) {
            node.learn = LearnContent { blocks };
        }
    }

    pub fn set_questions(&mut self, id: &str, questions: Vec<QuizQuestion>) {
        if let Some(node) = self.nodes.iter_mut().find(|node| node.id == id) {
            node.quiz = QuizContent { questions };
        }
    }

    pub fn set_status(&mut self, id: &str, status: NoteStatus) {
        if let Some(node) = self.nodes.iter_mut().find(|node| node.id == id) {
            node.status = status;
        }
    }

    pub fn move_nodes(&mut self, moves: &[(String, f64, f64)]) {
        for (id, x, y) in moves {
            if let Some(node) = self.nodes.iter_mut().find(|node| &node.id == id) {
                node.x = *x;
                node.y = *y;
            }
        }
    }

    pub fn add_link(&mut self, from: &str, to: &str, from_side: Side, to_side: Side) {
        if from == to || edge_exists_between(&self.links, from, to, None) {
            return;
        }
        self.links.push(MindmapLink {
            id: crate::domain::quiz::new_id("l"),
            from_node: from.to_string(),
            to: to.to_string(),
            from_side,
            to_side,
        });
    }

    /// Move one end of an existing edge to another node. The caller has
    /// already validated that the pointer is over a node; this method keeps
    /// the final self-link and duplicate-link guards.
    pub fn rewire_link(&mut self, id: &str, moving: EdgeEnd, node_id: &str, side: Side) -> bool {
        let Some(index) = self.links.iter().position(|link| link.id == id) else {
            return false;
        };
        let other_end = match moving {
            EdgeEnd::From => self.links[index].to.clone(),
            EdgeEnd::To => self.links[index].from_node.clone(),
        };
        if node_id == other_end || edge_exists_between(&self.links, &other_end, node_id, Some(id)) {
            return false;
        }

        let link = &mut self.links[index];
        match moving {
            EdgeEnd::From => {
                link.from_node = node_id.to_string();
                link.from_side = side;
            }
            EdgeEnd::To => {
                link.to = node_id.to_string();
                link.to_side = side;
            }
        }
        true
    }

    pub fn remove_link(&mut self, id: &str) {
        self.links.retain(|link| link.id != id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn link(id: &str, from: &str, to: &str) -> MindmapLink {
        MindmapLink {
            id: id.to_string(),
            from_node: from.to_string(),
            to: to.to_string(),
            from_side: Side::Right,
            to_side: Side::Left,
        }
    }

    #[test]
    fn rewires_edges_and_rejects_conflicts() {
        let mut graph = GraphState {
            nodes: Vec::new(),
            links: vec![
                link("l1", "a", "b"),
                link("l2", "b", "c"),
                link("l3", "a", "c"),
            ],
        };

        assert!(!graph.rewire_link("l1", EdgeEnd::From, "b", Side::Right));
        assert!(!graph.rewire_link("l1", EdgeEnd::From, "c", Side::Right));
        assert!(!graph.rewire_link("missing", EdgeEnd::From, "d", Side::Right));
        assert!(graph.rewire_link("l1", EdgeEnd::From, "d", Side::Right));
        assert_eq!(graph.links[0].from_node, "d");
        assert_eq!(graph.links[0].from_side, Side::Right);
        assert!(graph.rewire_link("l1", EdgeEnd::To, "e", Side::Top));
        assert_eq!(graph.links[0].to, "e");
        assert_eq!(graph.links[0].to_side, Side::Top);
    }
}
