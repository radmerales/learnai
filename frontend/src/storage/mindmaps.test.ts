import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { emptyMindmap } from "../persistence"
import {
  MindmapStorageError,
  createMindmap,
  deleteMindmap,
  getMindmap,
  listMindmaps,
  saveMindmap,
} from "./mindmaps"

beforeEach(() => {
  window.localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("browser mindmap storage", () => {
  it("creates and retrieves a map", async () => {
    const created = await createMindmap(emptyMindmap())

    expect(created.id).toMatch(/^mm_/)
    expect(created.createdAt).toBe("2026-01-01T00:00:00.000Z")

    await expect(getMindmap(created.id)).resolves.toEqual(created)
  })

  it("saves the full document and preserves the creation time", async () => {
    const created = await createMindmap(emptyMindmap())
    vi.setSystemTime(new Date("2026-01-02T00:00:00.000Z"))

    const saved = await saveMindmap(created.id, {
      ...emptyMindmap(),
      title: "Biology",
    })

    expect(saved.title).toBe("Biology")
    expect(saved.createdAt).toBe("2026-01-01T00:00:00.000Z")
    expect(saved.updatedAt).toBe("2026-01-02T00:00:00.000Z")
    await expect(getMindmap(created.id)).resolves.toEqual(saved)
  })

  it("lists the most recently updated maps first", async () => {
    const first = await createMindmap(emptyMindmap())
    vi.setSystemTime(new Date("2026-01-02T00:00:00.000Z"))
    const second = await createMindmap({ ...emptyMindmap(), title: "History" })

    const list = await listMindmaps()

    expect(list.map((map) => map.id)).toEqual([second.id, first.id])
    expect(list[0]).toMatchObject({ title: "History" })
  })

  it("deletes a map", async () => {
    const created = await createMindmap(emptyMindmap())

    await deleteMindmap(created.id)

    await expect(getMindmap(created.id)).rejects.toMatchObject({
      name: "MindmapStorageError",
      status: 404,
    })
    await expect(listMindmaps()).resolves.toEqual([])
  })

  it("reports unreadable storage instead of crashing", async () => {
    window.localStorage.setItem("learnai.mindmaps.v1", "not json")

    await expect(listMindmaps()).rejects.toBeInstanceOf(MindmapStorageError)
  })
})
