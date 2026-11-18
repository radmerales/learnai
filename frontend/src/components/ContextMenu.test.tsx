import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ContextMenuState } from "../contextMenu"
import { ContextMenu } from "./ContextMenu"

function renderMenu(overrides: Partial<ContextMenuState> = {}) {
  const onSelect = vi.fn()
  const onClose = vi.fn()
  const menu: ContextMenuState = {
    label: "Biology",
    x: 100,
    y: 80,
    items: [
      { label: "Arrow to target →", onSelect: vi.fn(), checked: true },
      { label: "Delete node", onSelect, danger: true },
    ],
    ...overrides,
  }
  const view = render(<ContextMenu menu={menu} onClose={onClose} />)
  return { ...view, menu, onSelect, onClose }
}

describe("ContextMenu", () => {
  it("renders the label and all items", () => {
    renderMenu()

    expect(screen.getByRole("menu", { name: "Actions for Biology" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Arrow to target/ })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: /Delete node/ })).toBeInTheDocument()
  })

  it("selects an item and closes", () => {
    const { onSelect, onClose } = renderMenu()

    fireEvent.click(screen.getByRole("menuitem", { name: /Delete node/ }))

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("does not draw a border on the delete action", () => {
    renderMenu()

    expect(screen.getByRole("menuitem", { name: /Delete node/ })).toHaveClass("border-0")
  })

  it("closes on Escape and outside pointer-down", () => {
    const { onClose, container } = renderMenu()

    fireEvent.keyDown(window, { key: "Escape" })
    fireEvent.pointerDown(container.querySelector(".fixed.inset-0")!)

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
