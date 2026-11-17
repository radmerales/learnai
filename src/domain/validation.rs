use std::collections::HashSet;

use super::document::{MindmapDocument, MindmapNode};

pub const MAX_NODES: usize = 2_000;
pub const MAX_LINKS: usize = 5_000;
pub const MAX_BLOCKS: usize = 200;
pub const MAX_QUESTIONS: usize = 200;
pub const MAX_OPTIONS: usize = 8;

pub fn normalize_title(title: &str) -> String {
    let trimmed = title.trim();
    if trimmed.is_empty() {
        "Untitled mindmap".to_string()
    } else {
        trimmed.to_string()
    }
}

pub fn validate_document(document: &MindmapDocument) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    if document.schema_version != 1 {
        errors.push("schemaVersion must be 1".to_string());
    }
    if document.title.trim().is_empty() || document.title.chars().count() > 200 {
        errors.push("title must contain 1-200 characters".to_string());
    }
    if document.nodes.len() > MAX_NODES {
        errors.push(format!("nodes cannot exceed {MAX_NODES}"));
    }
    if document.links.len() > MAX_LINKS {
        errors.push(format!("links cannot exceed {MAX_LINKS}"));
    }

    validate_nodes(&document.nodes, &mut errors);
    validate_links(document, &mut errors);

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

fn validate_nodes(nodes: &[MindmapNode], errors: &mut Vec<String>) {
    let mut node_ids = HashSet::new();
    for node in nodes {
        if node.id.trim().is_empty() || node.id.chars().count() > 64 {
            errors.push("node ids must contain 1-64 characters".to_string());
        }
        if !node_ids.insert(node.id.clone()) {
            errors.push(format!("node id {} is duplicated", node.id));
        }
        if node.label.chars().count() > 300 {
            errors.push(format!("node {} label is too long", node.id));
        }
        if !node.x.is_finite() || !node.y.is_finite() {
            errors.push(format!("node {} coordinates must be finite", node.id));
        }
        if !node.width.is_finite() || !(40.0..=5_000.0).contains(&node.width) {
            errors.push(format!(
                "node {} width must be between 40 and 5000",
                node.id
            ));
        }
        if node.learn.blocks.len() > MAX_BLOCKS {
            errors.push(format!("node {} has too many Learn blocks", node.id));
        }
        for block in &node.learn.blocks {
            if block.chars().count() > 50_000 {
                errors.push(format!(
                    "node {} contains a Learn block that is too long",
                    node.id
                ));
            }
        }
        validate_quiz(node, errors);
    }
}

fn validate_quiz(node: &MindmapNode, errors: &mut Vec<String>) {
    if node.quiz.questions.len() > MAX_QUESTIONS {
        errors.push(format!("node {} has too many quiz questions", node.id));
    }

    let mut question_ids = HashSet::new();
    for question in &node.quiz.questions {
        if !question_ids.insert(question.id.clone()) {
            errors.push(format!("node {} has duplicate question ids", node.id));
        }
        if question.prompt.chars().count() > 4_000 {
            errors.push(format!("question {} prompt is too long", question.id));
        }
        if !(2..=MAX_OPTIONS).contains(&question.options.len()) {
            errors.push(format!(
                "question {} must have between 2 and {MAX_OPTIONS} options",
                question.id
            ));
        }
        for option in &question.options {
            if option.chars().count() > 1_000 {
                errors.push(format!(
                    "question {} has an option that is too long",
                    question.id
                ));
            }
        }
        if question.answer_index >= question.options.len() {
            errors.push(format!(
                "question {} answerIndex must point at one of its options",
                question.id
            ));
        }
    }
}

fn validate_links(document: &MindmapDocument, errors: &mut Vec<String>) {
    let known: HashSet<&str> = document.nodes.iter().map(|node| node.id.as_str()).collect();
    let mut link_ids = HashSet::new();
    let mut pairs = HashSet::new();

    for link in &document.links {
        if !link_ids.insert(link.id.clone()) {
            errors.push(format!("link id {} is duplicated", link.id));
        }
        if !known.contains(link.from_node.as_str()) {
            errors.push(format!("link {} starts at an unknown node", link.id));
        }
        if !known.contains(link.to.as_str()) {
            errors.push(format!("link {} ends at an unknown node", link.id));
        }
        if link.from_node == link.to {
            errors.push(format!("link {} cannot connect a node to itself", link.id));
        }
        let pair = if link.from_node < link.to {
            (link.from_node.clone(), link.to.clone())
        } else {
            (link.to.clone(), link.from_node.clone())
        };
        if !pairs.insert(pair) {
            errors.push(format!(
                "link {} duplicates an existing connection",
                link.id
            ));
        }
    }
}
