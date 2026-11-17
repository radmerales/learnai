use std::fmt;

#[cfg(feature = "server")]
use dioxus::prelude::StatusCode;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub enum ApiError {
    NotFound,
    Validation(Vec<String>),
    Database(String),
}

impl fmt::Display for ApiError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NotFound => write!(formatter, "Mindmap not found"),
            Self::Validation(errors) => write!(formatter, "{}", errors.join("; ")),
            Self::Database(message) => write!(formatter, "{message}"),
        }
    }
}

impl std::error::Error for ApiError {}

#[cfg(feature = "server")]
impl From<sqlx::Error> for ApiError {
    fn from(error: sqlx::Error) -> Self {
        Self::Database(error.to_string())
    }
}

impl From<dioxus::fullstack::ServerFnError> for ApiError {
    fn from(error: dioxus::fullstack::ServerFnError) -> Self {
        Self::Database(error.to_string())
    }
}

#[cfg(feature = "server")]
impl dioxus::fullstack::AsStatusCode for ApiError {
    fn as_status_code(&self) -> StatusCode {
        match self {
            Self::NotFound => StatusCode::NOT_FOUND,
            Self::Validation(_) => StatusCode::UNPROCESSABLE_ENTITY,
            Self::Database(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}
