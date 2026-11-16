import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { saveMindmap } from "../api/mindmaps"
import type { MindmapDocument } from "../api/types"
import { toMindmapDocument } from "../persistence"
import { makeNode } from "../test/fixtures"
import { useMindmapAutosave } from "./useMindmapAutosave"

vi.mock("../api/mindmaps", () => ({
  saveMindmap: vi.fn(),
}))

const mockedSave = vi.mocked(saveMindmap)

type Options = Parameters<typeof useMindmapAutosave>[0]

function setup(overrides: Partial<Options> = {}) {
  const document = toMindmapDocument("Biology", [makeNode()], [])
  const onSaved = vi.fn()
  const options: Options = {
    currentId: "m1",
    document,
    documentJson: JSON.stringify(document),
    loading: false,
    onSaved,
    ...overrides,
  }
  const hook = renderHook(() => useMindmapAutosave(options))
  return { ...hook, document, onSaved }
}

function resourceFor(document: MindmapDocument) {
  return {
    ...document,
    id: "m1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  const document = toMindmapDocument("Biology", [makeNode()], [])
  mockedSave.mockReset()
  mockedSave.mockResolvedValue(resourceFor(document))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useMindmapAutosave", () => {
  it("waits for the debounce delay before saving", async () => {
    const { result, document, onSaved } = setup()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(799)
    })
    expect(mockedSave).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(mockedSave).toHaveBeenCalledTimes(1)
    expect(mockedSave.mock.calls[0][0]).toBe("m1")
    expect(mockedSave.mock.calls[0][1]).toEqual(document)
    expect(onSaved).toHaveBeenCalledTimes(1)
    expect(result.current.saveStatus).toBe("saved")
  })

  it("does not save while the map library is loading", async () => {
    setup({ loading: true })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000)
    })

    expect(mockedSave).not.toHaveBeenCalled()
  })

  it("skips the save when the document was just loaded", async () => {
    const { result } = setup()
    const document = toMindmapDocument("Biology", [makeNode()], [])

    act(() => {
      result.current.markSaved("m1", JSON.stringify(document))
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000)
    })

    expect(mockedSave).not.toHaveBeenCalled()
    expect(result.current.saveStatus).toBe("saved")
  })

  it("flushes immediately for map switches", async () => {
    const { result } = setup()

    await act(async () => {
      await result.current.flush()
    })

    expect(mockedSave).toHaveBeenCalledTimes(1)
    expect(result.current.saveStatus).toBe("saved")
  })

  it("reports save failures", async () => {
    mockedSave.mockRejectedValueOnce(new Error("Network unavailable"))
    const { result } = setup()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800)
    })

    expect(result.current.saveStatus).toBe("error")
    expect(result.current.saveError).toBe("Network unavailable")
  })

  it("retries the latest document after a failure", async () => {
    mockedSave.mockRejectedValueOnce(new Error("Offline"))
    const { result } = setup()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800)
    })

    act(() => {
      result.current.retry()
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(mockedSave).toHaveBeenCalledTimes(2)
    expect(result.current.saveStatus).toBe("saved")
  })
})
