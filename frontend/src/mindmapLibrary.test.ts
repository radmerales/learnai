import { afterEach, describe, expect, it, vi } from "vitest"

import { errorMessage } from "./errors"
import { readRememberedId, rememberId, summarize } from "./mindmapLibrary"
import { emptyMindmap } from "./persistence"

describe("mindmapLibrary", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it("turns a resource into a picker summary", () => {
    const document = emptyMindmap()
    const summary = summarize({
      ...document,
      id: "m1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    })

    expect(summary).toEqual({
      id: "m1",
      title: "Untitled mindmap",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    })
  })

  it("remembers and clears the last map", () => {
    rememberId("m1")
    expect(readRememberedId()).toBe("m1")

    rememberId(null)
    expect(readRememberedId()).toBeNull()
  })

  it("fails safely when localStorage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked")
    })

    expect(readRememberedId()).toBeNull()
    expect(() => rememberId("m1")).not.toThrow()
    expect(() => rememberId(null)).not.toThrow()
  })
})

describe("errorMessage", () => {
  it("uses Error messages and falls back for unknown values", () => {
    expect(errorMessage(new Error("Boom"))).toBe("Boom")
    expect(errorMessage("not an error")).toBe("Something went wrong")
  })
})
