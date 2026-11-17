use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "lowercase")]
pub enum Side {
    Top,
    Right,
    Bottom,
    Left,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "lowercase")]
pub enum NoteStatus {
    Todo,
    Doing,
    Done,
}

impl NoteStatus {
    pub fn label(&self) -> &'static str {
        match self {
            Self::Todo => "To Do",
            Self::Doing => "Doing",
            Self::Done => "Done",
        }
    }

    pub fn outline(&self) -> &'static str {
        match self {
            Self::Todo => "#6b6a6a",
            Self::Doing => "#1d4ed8",
            Self::Done => "#15803d",
        }
    }

    pub fn background(&self) -> &'static str {
        match self {
            Self::Todo => "#e1e0dd",
            Self::Doing => "#dbeafe",
            Self::Done => "#dcfce7",
        }
    }

    pub fn text(&self) -> &'static str {
        match self {
            Self::Todo => "#1d1d1d",
            Self::Doing => "#1e3a8a",
            Self::Done => "#14532d",
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct QuizQuestion {
    pub id: String,
    #[serde(default)]
    pub prompt: String,
    pub options: Vec<String>,
    pub answer_index: usize,
}

#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct LearnContent {
    #[serde(default)]
    pub blocks: Vec<String>,
}

#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct QuizContent {
    #[serde(default)]
    pub questions: Vec<QuizQuestion>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct MindmapNode {
    pub id: String,
    #[serde(default)]
    pub label: String,
    #[serde(default = "default_status")]
    pub status: NoteStatus,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    #[serde(default)]
    pub learn: LearnContent,
    #[serde(default)]
    pub quiz: QuizContent,
}

fn default_status() -> NoteStatus {
    NoteStatus::Todo
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, JsonSchema)]
pub struct MindmapLink {
    pub id: String,
    #[serde(rename = "from")]
    pub from_node: String,
    pub to: String,
    #[serde(rename = "fromSide")]
    pub from_side: Side,
    #[serde(rename = "toSide")]
    pub to_side: Side,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MindmapDocument {
    pub schema_version: u32,
    pub title: String,
    pub nodes: Vec<MindmapNode>,
    pub links: Vec<MindmapLink>,
}

impl MindmapDocument {
    pub fn empty(title: impl Into<String>) -> Self {
        Self {
            schema_version: 1,
            title: title.into(),
            nodes: Vec::new(),
            links: Vec::new(),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MindmapResource {
    #[serde(flatten)]
    pub document: MindmapDocument,
    pub id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct MindmapSummary {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
}
