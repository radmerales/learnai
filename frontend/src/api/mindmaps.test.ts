import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { emptyMindmap } from "../persistence"
import {
  MindmapApiError,
  createMindmap,
  deleteMindmap,
  getMindmap,
  listMindmaps,
  saveMindmap,
} from "./mindmaps"

const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 422 ? "Unprocessable Entity" : "OK",
    json: async () => body,
  }
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("mindmap API client", () => {
  it("loads the map list", async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: "m1", title: "Biology" }]))

    await expect(listMindmaps()).resolves.toEqual([{ id: "m1", title: "Biology" }])
    expect(fetchMock).toHaveBeenCalledWith("/api/mindmaps", undefined)
  })

  it("sends a full document with PUT and keepalive", async () => {
    const document = emptyMindmap()
    fetchMock.mockResolvedValue(jsonResponse({ ...document, id: "m1" }))

    await saveMindmap("m1", document, { keepalive: true })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("/api/mindmaps/m1")
    expect(init).toMatchObject({
      method: "PUT",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    })
    expect(JSON.parse(init.body)).toEqual(document)
  })

  it("creates and retrieves maps", async () => {
    const document = emptyMindmap()
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...document, id: "m1" }))
    await createMindmap(document)
    expect(fetchMock.mock.calls[0][0]).toBe("/api/mindmaps")
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" })

    fetchMock.mockResolvedValueOnce(jsonResponse({ ...document, id: "m/1" }))
    await getMindmap("m/1")
    expect(fetchMock.mock.calls[1][0]).toBe("/api/mindmaps/m%2F1")
  })

  it("uses a string detail from the server", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "Access denied" }, 403))

    await expect(listMindmaps()).rejects.toThrow("Access denied")
  })

  it("falls back to the HTTP status for unusable error bodies", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => ({ detail: [{}] }),
    })

    await expect(listMindmaps()).rejects.toThrow("500 Server Error")
  })

  it("turns FastAPI validation details into a readable error", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ detail: [{ msg: "answerIndex must point at an option" }] }, 422),
    )

    await expect(saveMindmap("m1", emptyMindmap())).rejects.toMatchObject({
      name: "MindmapApiError",
      status: 422,
      message: "answerIndex must point at an option",
    })
  })

  it("treats a 204 delete response as success", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      statusText: "No Content",
      json: async () => {
        throw new Error("204 has no JSON body")
      },
    })

    await expect(deleteMindmap("m1")).resolves.toBeUndefined()
    expect(fetchMock.mock.calls[0][0]).toBe("/api/mindmaps/m1")
    expect(fetchMock.mock.calls[0][1]).toEqual({ method: "DELETE" })
  })

  it("exposes MindmapApiError for callers", () => {
    const error = new MindmapApiError("Nope", 500)

    expect(error).toBeInstanceOf(Error)
    expect(error.status).toBe(500)
  })
})
