import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CanvasTextBox } from "./CanvasTextBox"

const textBox = { id: "t1", text: "Remember", x: 10, y: 20, width: 220 }

function renderBox(overrides: Partial<Parameters<typeof CanvasTextBox>[0]> = {}) {
  const props = {
    textBox,
    selected: false,
    editing: false,
    onStartEdit: vi.fn(),
    onCommit: vi.fn(),
    onCancel: vi.fn(),
    onPointerDown: vi.fn(),
    onContextMenu: vi.fn(),
    ...overrides,
  }
  const view = render(<CanvasTextBox {...props} />)
  return { ...view, ...props }
}

describe("CanvasTextBox", () => {
  it("renders text and opens editing on double-click", () => {
    const { onStartEdit } = renderBox()

    fireEvent.doubleClick(screen.getByRole("textbox", { name: "Canvas text" }))

    expect(onStartEdit).toHaveBeenCalledWith("t1")
  })

  it("starts dragging from a pointer down", () => {
    const { onPointerDown } = renderBox()

    fireEvent.pointerDown(screen.getByRole("textbox", { name: "Canvas text" }), {
      button: 0,
    })

    expect(onPointerDown).toHaveBeenCalledWith(expect.anything(), "t1")
  })

  it("commits edited text with Ctrl+Enter", () => {
    const { onCommit } = renderBox({ editing: true })
    const editor = screen.getByRole("textbox", { name: "Text box content" })

    fireEvent.change(editor, { target: { value: "Changed" } })
    fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true })

    expect(onCommit).toHaveBeenCalledWith("t1", "Changed")
  })

  it("cancels editing with Escape", () => {
    const { onCancel } = renderBox({ editing: true })

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Text box content" }), {
      key: "Escape",
    })

    expect(onCancel).toHaveBeenCalledOnce()
  })
})
