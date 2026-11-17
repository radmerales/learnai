use dioxus::prelude::*;

use crate::domain::document::{MindmapDocument, MindmapResource, MindmapSummary};

#[cfg(feature = "server")]
use crate::domain::validation::{normalize_title, validate_document};

use super::error::ApiError;

#[cfg(feature = "server")]
fn prepare(mut document: MindmapDocument) -> Result<MindmapDocument, ApiError> {
    document.title = normalize_title(&document.title);
    validate_document(&document).map_err(ApiError::Validation)?;
    Ok(document)
}

#[get("/api/mindmaps")]
pub async fn list_mindmaps() -> Result<Vec<MindmapSummary>, ApiError> {
    #[cfg(feature = "server")]
    {
        super::repository::list().await
    }
    #[cfg(not(feature = "server"))]
    {
        unreachable!()
    }
}

#[get("/api/mindmaps/{id}")]
pub async fn get_mindmap(id: String) -> Result<MindmapResource, ApiError> {
    #[cfg(feature = "server")]
    {
        super::repository::get(&id).await
    }
    #[cfg(not(feature = "server"))]
    {
        let _ = id;
        unreachable!()
    }
}

#[post("/api/mindmaps")]
pub async fn create_mindmap(document: MindmapDocument) -> Result<MindmapResource, ApiError> {
    #[cfg(feature = "server")]
    {
        super::repository::create(prepare(document)?).await
    }
    #[cfg(not(feature = "server"))]
    {
        let _ = document;
        unreachable!()
    }
}

#[put("/api/mindmaps/{id}")]
pub async fn save_mindmap(
    id: String,
    document: MindmapDocument,
) -> Result<MindmapResource, ApiError> {
    #[cfg(feature = "server")]
    {
        super::repository::replace(&id, prepare(document)?).await
    }
    #[cfg(not(feature = "server"))]
    {
        let _ = (id, document);
        unreachable!()
    }
}

#[delete("/api/mindmaps/{id}")]
pub async fn delete_mindmap(id: String) -> Result<(), ApiError> {
    #[cfg(feature = "server")]
    {
        super::repository::delete(&id).await
    }
    #[cfg(not(feature = "server"))]
    {
        let _ = id;
        unreachable!()
    }
}
