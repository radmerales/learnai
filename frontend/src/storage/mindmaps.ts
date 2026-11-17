/**
 * Browser-only map storage.
 *
 * GitHub Pages cannot run a backend, so every map is kept in localStorage
 * under one versioned key. The async function signatures match the old HTTP
 * client so the sync/autosave hooks did not need to change.
 *
 * Python comparison: localStorage is like a small persistent dict that belongs
 * to the browser tab's origin. It survives refreshes, but clearing site data
 * removes the maps.
 */
import type {
  MindmapDocument,
  MindmapResource,
  MindmapSummary,
} from "./types"

const STORAGE_KEY = "learnai.mindmaps.v1"

type Store = Record<string, MindmapResource>

/** A typed storage error so the UI can show a useful message. */
export class MindmapStorageError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = "MindmapStorageError"
    this.status = status
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function readStore(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new MindmapStorageError("Saved maps are not in a readable format.")
    }
    return parsed as Store
  } catch (error) {
    if (error instanceof MindmapStorageError) throw error
    throw new MindmapStorageError(
      "Could not read saved maps from this browser. Site storage may be disabled.",
    )
  }
}

function writeStore(store: Store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    throw new MindmapStorageError(
      "Could not save to browser storage. Storage may be full or disabled.",
    )
  }
}

function newId(): string {
  const random =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}_${Math.random().toString(16).slice(2)}`
  return `mm_${random.replaceAll("-", "")}`
}

function now(): string {
  return new Date().toISOString()
}

function summarize(resource: MindmapResource): MindmapSummary {
  return {
    id: resource.id,
    title: resource.title,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  }
}

export async function listMindmaps(): Promise<MindmapSummary[]> {
  return Object.values(readStore())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(summarize)
}

export async function createMindmap(
  document: MindmapDocument,
): Promise<MindmapResource> {
  const store = readStore()
  const timestamp = now()
  const resource: MindmapResource = {
    ...clone(document),
    id: newId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  store[resource.id] = resource
  writeStore(store)
  return clone(resource)
}

export async function getMindmap(id: string): Promise<MindmapResource> {
  const resource = readStore()[id]
  if (!resource) throw new MindmapStorageError("Map not found in this browser.", 404)
  return clone(resource)
}

export async function saveMindmap(
  id: string,
  document: MindmapDocument,
): Promise<MindmapResource> {
  const store = readStore()
  const existing = store[id]
  if (!existing) throw new MindmapStorageError("Map not found in this browser.", 404)

  const resource: MindmapResource = {
    ...clone(document),
    id,
    createdAt: existing.createdAt,
    updatedAt: now(),
  }
  store[id] = resource
  writeStore(store)
  return clone(resource)
}

export async function deleteMindmap(id: string): Promise<void> {
  const store = readStore()
  delete store[id]
  writeStore(store)
}
