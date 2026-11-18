import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useMindmapContextMenu } from "./useMindmapContextMenu"

const menu = {
  label: "Canvas",
  x: 120,
  y: 80,
  items: [{ label: "New node", onSelect: vi.fn() }],
}

describe("useMindmapContextMenu", () => {
  it("opens and closes a menu", () => {
    const { result } = renderHook(() => useMindmapContextMenu())

    act(() => result.current.open(menu))
    expect(result.current.contextMenu).toBe(menu)

    act(() => result.current.close())
    expect(result.current.contextMenu).toBeNull()
  })
})
