import type { MindmapDocument, MindmapResource, MindmapSummary } from "./types"

const BASE_PATH = "/api/mindmaps"

export class MindmapApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "MindmapApiError"
    this.status = status
  }
}

function detailMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null
  const detail = (payload as { detail?: unknown }).detail
  if (typeof detail === "string") return detail

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg)
        }
        return null
      })
      .filter((message): message is string => Boolean(message))
    if (messages.length > 0) return messages.join("; ")
  }

  return null
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_PATH}${path}`, init)
  if (!response.ok) {
    let payload: unknown = null
    try {
      payload = await response.json()
    } catch {
      // The server may return an empty or non-JSON error body.
    }
    throw new MindmapApiError(
      detailMessage(payload) ?? `${response.status} ${response.statusText}`,
      response.status,
    )
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

function jsonRequest(method: string, body: unknown, keepalive = false): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive,
  }
}

export function listMindmaps(): Promise<MindmapSummary[]> {
  return request<MindmapSummary[]>("")
}

export function createMindmap(document: MindmapDocument): Promise<MindmapResource> {
  return request<MindmapResource>("", jsonRequest("POST", document))
}

export function getMindmap(id: string): Promise<MindmapResource> {
  return request<MindmapResource>(`/${encodeURIComponent(id)}`)
}

export function saveMindmap(
  id: string,
  document: MindmapDocument,
  options: { keepalive?: boolean } = {},
): Promise<MindmapResource> {
  return request<MindmapResource>(
    `/${encodeURIComponent(id)}`,
    jsonRequest("PUT", document, options.keepalive ?? false),
  )
}

export function deleteMindmap(id: string): Promise<void> {
  return request<void>(`/${encodeURIComponent(id)}`, { method: "DELETE" })
}
