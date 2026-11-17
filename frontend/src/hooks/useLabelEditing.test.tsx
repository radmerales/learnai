import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { makeNode } from "../test/fixtures"
import { useLabelEditing } from "./useLabelEditing"

function setup() {
  const node = makeNode({ id: "n1", label: "Original" })
  const renameNode = vi.fn()
  const hook = renderHook(() =>
    useLabelEditing({ byId: new Map([[node.id, node]]), renameNode }),
  )
  return { ...hook, node, renameNode }
}

describe("useLabelEditing", () => {
  it("starts with the node label and commits a trimmed value", () => {
    const { result, node, renameNode } = setup()

    act(() => result.current.startEditing(node))
    expect(result.current.editingId).toBe("n1")
    expect(result.current.draftLabel).toBe("Original")

    act(() => result.current.setDraftLabel("  Updated  "))
    act(() => result.current.commitEditing())

    expect(renameNode).toHaveBeenCalledWith("n1", "Updated")
    expect(result.current.editingId).toBeNull()
    expect(result.current.draftLabel).toBe("")
  })

  it("falls back to the previous label when blank", () => {
    const { result, node, renameNode } = setup()

    act(() => result.current.startEditing(node))
    act(() => result.current.setDraftLabel("   "))
    act(() => result.current.commitEditing())

    expect(renameNode).toHaveBeenCalledWith("n1", "Original")
  })

  it("cancels without renaming", () => {
    const { result, node, renameNode } = setup()

    act(() => result.current.startEditing(node))
    act(() => result.current.setDraftLabel("Discard me"))
    act(() => result.current.cancelEditing())

    expect(renameNode).not.toHaveBeenCalled()
    expect(result.current.editingId).toBeNull()
  })
})
