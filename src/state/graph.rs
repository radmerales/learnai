use crate::domain::document::{
    LearnContent, MindmapDocument, MindmapLink, MindmapNode, MindmapResource, NoteStatus,
    QuizContent, QuizQuestion, Side,
};
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
        if from == to
            || self.links.iter().any(|link| {
                (link.from_node == from && link.to == to)
                    || (link.from_node == to && link.to == from)
            })
        {
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

    pub fn remove_link(&mut self, id: &str) {
        self.links.retain(|link| link.id != id);
    }
}
