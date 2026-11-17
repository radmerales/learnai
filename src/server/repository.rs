use chrono::{SecondsFormat, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use sqlx::types::Json;
use uuid::Uuid;

use crate::domain::document::{
    MindmapDocument, MindmapLink, MindmapNode, MindmapResource, MindmapSummary,
};
use crate::domain::validation::normalize_title;

use super::error::ApiError;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StoredDocument {
    pub nodes: Vec<MindmapNode>,
    pub links: Vec<MindmapLink>,
}

#[derive(Debug, FromRow)]
struct MindmapRow {
    id: String,
    title: String,
    document: Json<StoredDocument>,
    schema_version: i64,
    created_at: String,
    updated_at: String,
}

fn now() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}

fn new_mindmap_id() -> String {
    format!("mm_{}", Uuid::new_v4().simple())
}

fn to_resource(row: MindmapRow) -> MindmapResource {
    MindmapResource {
        document: MindmapDocument {
            schema_version: row.schema_version as u32,
            title: row.title,
            nodes: row.document.0.nodes,
            links: row.document.0.links,
        },
        id: row.id,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

fn to_summary(row: &MindmapRow) -> MindmapSummary {
    MindmapSummary {
        id: row.id.clone(),
        title: row.title.clone(),
        created_at: row.created_at.clone(),
        updated_at: row.updated_at.clone(),
    }
}

pub async fn list() -> Result<Vec<MindmapSummary>, ApiError> {
    let pool = super::db::db().await.map_err(ApiError::Database)?;
    let rows = sqlx::query_as::<_, MindmapRow>(
        "SELECT id, title, document, schema_version, created_at, updated_at \
         FROM mindmaps ORDER BY updated_at DESC",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows.iter().map(to_summary).collect())
}

pub async fn get(id: &str) -> Result<MindmapResource, ApiError> {
    let pool = super::db::db().await.map_err(ApiError::Database)?;
    let row = sqlx::query_as::<_, MindmapRow>(
        "SELECT id, title, document, schema_version, created_at, updated_at \
         FROM mindmaps WHERE id = ?",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or(ApiError::NotFound)?;
    Ok(to_resource(row))
}

pub async fn create(document: MindmapDocument) -> Result<MindmapResource, ApiError> {
    let pool = super::db::db().await.map_err(ApiError::Database)?;
    let id = new_mindmap_id();
    let title = normalize_title(&document.title);
    let timestamp = now();
    let stored = StoredDocument {
        nodes: document.nodes,
        links: document.links,
    };
    sqlx::query(
        "INSERT INTO mindmaps (id, title, document, schema_version, created_at, updated_at) \
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&title)
    .bind(Json(&stored))
    .bind(document.schema_version as i64)
    .bind(&timestamp)
    .bind(&timestamp)
    .execute(pool)
    .await?;

    Ok(MindmapResource {
        document: MindmapDocument {
            schema_version: document.schema_version,
            title,
            nodes: stored.nodes,
            links: stored.links,
        },
        id,
        created_at: timestamp.clone(),
        updated_at: timestamp,
    })
}

pub async fn replace(id: &str, document: MindmapDocument) -> Result<MindmapResource, ApiError> {
    let pool = super::db::db().await.map_err(ApiError::Database)?;
    let title = normalize_title(&document.title);
    let stored = StoredDocument {
        nodes: document.nodes,
        links: document.links,
    };
    let result = sqlx::query(
        "UPDATE mindmaps SET title = ?, document = ?, schema_version = ?, updated_at = ? \
         WHERE id = ?",
    )
    .bind(&title)
    .bind(Json(&stored))
    .bind(document.schema_version as i64)
    .bind(now())
    .bind(id)
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }
    get(id).await
}

pub async fn delete(id: &str) -> Result<(), ApiError> {
    let pool = super::db::db().await.map_err(ApiError::Database)?;
    let result = sqlx::query("DELETE FROM mindmaps WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }
    Ok(())
}
