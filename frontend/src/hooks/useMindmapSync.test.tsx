import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createMindmap, deleteMindmap, getMindmap, listMindmaps } from "../api/mindmaps"
import type { MindmapResource, MindmapSummary } from "../api/types"
import { toMindmapDocument } from "../persistence"
import { makeNode } from "../test/fixtures"
import { useMindmapSync } from "./useMindmapSync"

vi.mock("../api/mindmaps", () => ({
  listMindmaps: vi.fn(),
  getMindmap: vi.fn(),
  createMindmap: vi.fn(),
  deleteMindmap: vi.fn(),
  saveMindmap: vi.fn(),
}))

const document = toMindmapDocument("Biology", [makeNode()], [])
const resource: MindmapResource = {
  ...document,
  id: "m1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}
const summary: MindmapSummary = {
  id: "m1",
  title: "Biology",
  createdAt: resource.createdAt,
  updatedAt: resource.updatedAt,
}

beforeEach(() => {
  window.localStorage.clear()
})

function renderSync(onLoad = vi.fn()) {
  return renderHook(() => useMindmapSync({ nodes: [], links: [], onLoad }))
}

describe("useMindmapSync", () => {
  it("loads the most recent map and hands it to the graph", async () => {
    vi.mocked(listMindmaps).mockResolvedValue([summary])
    vi.mocked(getMindmap).mockResolvedValue(resource)
    const onLoad = vi.fn()

    const { result } = renderSync(onLoad)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.currentId).toBe("m1")
    expect(result.current.title).toBe("Biology")
    expect(result.current.loadError).toBeNull()
    expect(onLoad).toHaveBeenCalledWith(
      [expect.objectContaining({ id: "n1", label: "Node 1" })],
      [],
    )
  })

  it("creates a first map when the library is empty", async () => {
    vi.mocked(listMindmaps).mockResolvedValue([])
    vi.mocked(createMindmap).mockResolvedValue(resource)
    const onLoad = vi.fn()

    const { result } = renderSync(onLoad)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(createMindmap).toHaveBeenCalledTimes(1)
    expect(result.current.currentId).toBe("m1")
    expect(onLoad).toHaveBeenCalledTimes(1)
  })

  it("remembers the last opened map", async () => {
    window.localStorage.setItem("learnai.lastMindmapId", "m2")
    vi.mocked(listMindmaps).mockResolvedValue([
      { ...summary, id: "m2", title: "History" },
      summary,
    ])
    vi.mocked(getMindmap).mockResolvedValue({ ...resource, id: "m2", title: "History" })

    const { result } = renderSync()

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(getMindmap).toHaveBeenCalledWith("m2")
    expect(result.current.title).toBe("History")
  })

  it("reports list failures instead of creating a duplicate map", async () => {
    vi.mocked(listMindmaps).mockRejectedValue(new Error("Backend unavailable"))

    const { result } = renderSync()

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.loadError).toBe("Backend unavailable")
    expect(createMindmap).not.toHaveBeenCalled()
    expect(result.current.currentId).toBeNull()
  })

  it("deletes the current map and loads the next one", async () => {
    vi.mocked(listMindmaps).mockResolvedValue([summary])
    vi.mocked(getMindmap).mockResolvedValue(resource)
    vi.mocked(deleteMindmap).mockResolvedValue(undefined)

    const { result } = renderSync()
    await waitFor(() => expect(result.current.currentId).toBe("m1"))

    vi.mocked(listMindmaps).mockResolvedValue([])
    vi.mocked(createMindmap).mockResolvedValue({
      ...resource,
      id: "m2",
      title: "Untitled mindmap",
    })
    vi.mocked(deleteMindmap).mockResolvedValue(undefined)

    await act(async () => {
      await result.current.deleteMap("m1")
    })

    expect(deleteMindmap).toHaveBeenCalledWith("m1")
    await waitFor(() => expect(result.current.currentId).toBe("m2"))
  })
})
