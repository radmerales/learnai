use uuid::Uuid;

use super::document::{LearnContent, MindmapNode, NoteStatus, QuizContent, QuizQuestion};

pub const MIN_QUIZ_OPTIONS: usize = 2;
pub const DEFAULT_QUIZ_OPTIONS: usize = 4;

pub fn new_id(prefix: &str) -> String {
    format!("{prefix}_{}", Uuid::new_v4().simple())
}

pub fn new_question() -> QuizQuestion {
    QuizQuestion {
        id: new_id("q"),
        prompt: String::new(),
        options: vec![String::new(); DEFAULT_QUIZ_OPTIONS],
        answer_index: 0,
    }
}

pub fn new_node(x: f64, y: f64, label: String) -> MindmapNode {
    MindmapNode {
        id: new_id("n"),
        width: measure_node_width(&label),
        label,
        status: NoteStatus::Todo,
        x,
        y,
        learn: LearnContent {
            blocks: vec![String::new()],
        },
        quiz: QuizContent {
            questions: Vec::new(),
        },
    }
}

pub fn measure_node_width(label: &str) -> f64 {
    (label.chars().count() as f64 * 8.0 + 32.0).max(140.0)
}

#[allow(dead_code)]
pub fn next_node_number(nodes: &[MindmapNode]) -> usize {
    nodes
        .iter()
        .filter_map(|node| node.label.strip_prefix("Node "))
        .filter_map(|number| number.parse::<usize>().ok())
        .max()
        .unwrap_or(0)
        + 1
}

pub fn update_option(
    question: &QuizQuestion,
    index: usize,
    value: impl Into<String>,
) -> QuizQuestion {
    let mut next = question.clone();
    if let Some(option) = next.options.get_mut(index) {
        *option = value.into();
    }
    next
}

pub fn add_option(question: &QuizQuestion) -> QuizQuestion {
    let mut next = question.clone();
    next.options.push(String::new());
    next
}

pub fn delete_option(question: &QuizQuestion, index: usize) -> QuizQuestion {
    if question.options.len() <= MIN_QUIZ_OPTIONS {
        return question.clone();
    }
    let mut next = question.clone();
    next.options.remove(index);
    if index < next.answer_index {
        next.answer_index -= 1;
    } else if index == next.answer_index {
        next.answer_index = next.answer_index.min(next.options.len() - 1);
    }
    next
}
