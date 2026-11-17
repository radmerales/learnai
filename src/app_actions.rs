use dioxus::prelude::*;

use crate::components::panel::NodePanel;
use crate::domain::document::{MindmapDocument, MindmapNode, MindmapResource, MindmapSummary};
use crate::platform;
use crate::server::{
    ApiError, create_mindmap, delete_mindmap, get_mindmap, list_mindmaps, save_mindmap,
};
use crate::state::{GraphState, Selection};

pub fn document_json(document: &MindmapDocument) -> String {
    serde_json::to_string(document).unwrap_or_default()
}

pub fn summary_from(resource: &MindmapResource) -> MindmapSummary {
    MindmapSummary {
        id: resource.id.clone(),
        title: resource.document.title.clone(),
        created_at: resource.created_at.clone(),
        updated_at: resource.updated_at.clone(),
    }
}

#[allow(clippy::too_many_arguments)]
pub fn apply_resource(
    resource: MindmapResource,
    mut graph: Signal<GraphState>,
    mut title: Signal<String>,
    mut current_id: Signal<Option<String>>,
    mut last_saved: Signal<String>,
    mut selection: Signal<Selection>,
    mut maps: Signal<Vec<MindmapSummary>>,
    mut save_status: Signal<String>,
) {
    let summary = summary_from(&resource);
    let mut list = maps();
    if let Some(existing) = list.iter_mut().find(|item| item.id == summary.id) {
        *existing = summary;
    } else {
        list.insert(0, summary);
    }
    maps.set(list);

    graph.set(GraphState::from_resource(&resource));
    title.set(resource.document.title.clone());
    current_id.set(Some(resource.id.clone()));
    last_saved.set(document_json(&resource.document));
    selection.write().clear();
    save_status.set("saved".to_string());
    platform::remember_id(Some(resource.id));
}

pub async fn load_initial() -> Result<(Vec<MindmapSummary>, MindmapResource), ApiError> {
    let mut maps = list_mindmaps().await?;
    let remembered = platform::remembered_id();
    let target = remembered
        .filter(|id| maps.iter().any(|map| &map.id == id))
        .or_else(|| maps.first().map(|map| map.id.clone()));

    let resource = if let Some(id) = target {
        get_mindmap(id).await?
    } else {
        let resource = create_mindmap(MindmapDocument::empty("Untitled mindmap")).await?;
        maps.insert(0, summary_from(&resource));
        resource
    };
    Ok((maps, resource))
}

pub fn title_change_handler(
    mut title: Signal<String>,
    current_id: Signal<Option<String>>,
    mut maps: Signal<Vec<MindmapSummary>>,
) -> impl FnMut(String) + 'static {
    move |next: String| {
        title.set(next.clone());
        if let Some(id) = current_id() {
            let mut list = maps();
            if let Some(summary) = list.iter_mut().find(|summary| summary.id == id) {
                summary.title = next;
                maps.set(list);
            }
        }
    }
}

#[allow(clippy::too_many_arguments)]
pub fn open_map_handler(
    mut loading: Signal<bool>,
    mut load_error: Signal<Option<String>>,
    current_id: Signal<Option<String>>,
    graph: Signal<GraphState>,
    title: Signal<String>,
    last_saved: Signal<String>,
    selection: Signal<Selection>,
    maps: Signal<Vec<MindmapSummary>>,
    save_status: Signal<String>,
) -> impl FnMut(String) + 'static {
    move |id: String| {
        let previous_id = current_id();
        let previous_document = graph().document(title());
        spawn(async move {
            if let Some(previous_id) = previous_id {
                let _ = save_mindmap(previous_id, previous_document).await;
            }
            loading.set(true);
            load_error.set(None);
            match get_mindmap(id).await {
                Ok(resource) => apply_resource(
                    resource,
                    graph,
                    title,
                    current_id,
                    last_saved,
                    selection,
                    maps,
                    save_status,
                ),
                Err(error) => load_error.set(Some(error.to_string())),
            }
            loading.set(false);
        });
    }
}

#[allow(clippy::too_many_arguments)]
pub fn new_map_handler(
    mut loading: Signal<bool>,
    mut load_error: Signal<Option<String>>,
    current_id: Signal<Option<String>>,
    graph: Signal<GraphState>,
    title: Signal<String>,
    last_saved: Signal<String>,
    selection: Signal<Selection>,
    maps: Signal<Vec<MindmapSummary>>,
    save_status: Signal<String>,
) -> impl FnMut(()) + 'static {
    move |_| {
        let previous_id = current_id();
        let previous_document = graph().document(title());
        spawn(async move {
            if let Some(previous_id) = previous_id {
                let _ = save_mindmap(previous_id, previous_document).await;
            }
            loading.set(true);
            load_error.set(None);
            match create_mindmap(MindmapDocument::empty("Untitled mindmap")).await {
                Ok(resource) => apply_resource(
                    resource,
                    graph,
                    title,
                    current_id,
                    last_saved,
                    selection,
                    maps,
                    save_status,
                ),
                Err(error) => load_error.set(Some(error.to_string())),
            }
            loading.set(false);
        });
    }
}

#[allow(clippy::too_many_arguments)]
pub fn delete_map_handler(
    mut loading: Signal<bool>,
    mut load_error: Signal<Option<String>>,
    current_id: Signal<Option<String>>,
    graph: Signal<GraphState>,
    title: Signal<String>,
    last_saved: Signal<String>,
    selection: Signal<Selection>,
    mut maps: Signal<Vec<MindmapSummary>>,
    save_status: Signal<String>,
) -> impl FnMut(()) + 'static {
    move |_| {
        let Some(id) = current_id() else {
            return;
        };
        if !platform::confirm("Delete the current map? This cannot be undone.") {
            return;
        }
        spawn(async move {
            loading.set(true);
            load_error.set(None);
            if let Err(error) = delete_mindmap(id).await {
                load_error.set(Some(error.to_string()));
                loading.set(false);
                return;
            }
            let remaining = list_mindmaps().await.unwrap_or_default();
            maps.set(remaining.clone());
            let result = if let Some(next) = remaining.first() {
                get_mindmap(next.id.clone()).await
            } else {
                create_mindmap(MindmapDocument::empty("Untitled mindmap")).await
            };
            match result {
                Ok(resource) => apply_resource(
                    resource,
                    graph,
                    title,
                    current_id,
                    last_saved,
                    selection,
                    maps,
                    save_status,
                ),
                Err(error) => load_error.set(Some(error.to_string())),
            }
            loading.set(false);
        });
    }
}

pub fn retry_save_handler(
    current_id: Signal<Option<String>>,
    graph: Signal<GraphState>,
    title: Signal<String>,
    mut last_saved: Signal<String>,
    mut save_status: Signal<String>,
    mut save_error: Signal<Option<String>>,
) -> impl FnMut(()) + 'static {
    move |_| {
        let Some(id) = current_id() else {
            return;
        };
        let document = graph().document(title());
        let json = document_json(&document);
        spawn(async move {
            save_status.set("saving".to_string());
            match save_mindmap(id, document).await {
                Ok(_) => {
                    last_saved.set(json);
                    save_status.set("saved".to_string());
                    save_error.set(None);
                }
                Err(error) => {
                    save_status.set("error".to_string());
                    save_error.set(Some(error.to_string()));
                }
            }
        });
    }
}

#[component]
pub fn PanelHost(
    node: MindmapNode,
    graph: Signal<GraphState>,
    selection: Signal<Selection>,
) -> Element {
    let title_id = node.id.clone();
    let status_id = node.id.clone();
    let blocks_id = node.id.clone();
    let questions_id = node.id.clone();
    let delete_id = node.id.clone();

    rsx! {
        NodePanel {
            node,
            on_title_change: move |label| graph.write().rename_node(&title_id, label),
            on_status_change: move |status| graph.write().set_status(&status_id, status),
            on_blocks_change: move |blocks| graph.write().set_blocks(&blocks_id, blocks),
            on_questions_change: move |questions| graph.write().set_questions(&questions_id, questions),
            on_close: move |_| selection.write().close_panel(),
            on_delete: move |_| {
                graph.write().remove_node(&delete_id);
                selection.write().clear();
            },
        }
    }
}
