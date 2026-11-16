import type { MindmapResource, MindmapSummary } from "./api/types"

const LAST_MAP_KEY = "learnai.lastMindmapId"

/** Convert a full map response into the small row used by the map picker. */
export function summarize(resource: MindmapResource): MindmapSummary {
  return {
    id: resource.id,
    title: resource.title,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  }
}

/**
 * localStorage is a small key/value store built into the browser. It survives
 * refreshes but is optional: private browsing modes can throw when accessed,
 * so both helpers tolerate failures.
 */
export function readRememberedId(): string | null {
  try {
    return window.localStorage.getItem(LAST_MAP_KEY)
  } catch {
    return null
  }
}

export function rememberId(id: string | null) {
  try {
    if (id) {
      window.localStorage.setItem(LAST_MAP_KEY, id)
    } else {
      window.localStorage.removeItem(LAST_MAP_KEY)
    }
  } catch {
    // Ignore storage failures; the app still works without remembering a map.
  }
}
