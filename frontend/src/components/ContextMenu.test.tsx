import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ContextMenu } from "./ContextMenu"

function renderMenu(overrides: Partial<Parameters<typeof ContextMenu>[0]> = {}) {
  const props = {
    label: "Biology",
    deleteLabel: "Delete node",
    x: 100,
    y: 80,
    onDelete: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
  const view = render(<ContextMenu {...props} />)
  return { ...view, ...props }
}

describe("ContextMenu", () => {
  it("renders the label and delete action", () => {
    renderMenu()

    expect(screen.getByRole("menu", { name: "Actions for Biology" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Delete node" })).toBeInTheDocument()
  })

  it("deletes through the menu item", () => {
    const { onDelete } = renderMenu()

    fireEvent.click(screen.getByRole("menuitem", { name: "Delete node" }))

    expect(onDelete).toHaveBeenCalledOnce()
  })

  it("closes on Escape and outside pointer-down", () => {
    const { onClose, container } = renderMenu()

    fireEvent.keyDown(window, { key: "Escape" })
    fireEvent.pointerDown(container.querySelector(".fixed.inset-0")!)

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
