import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { MarkdownBlock } from "./MarkdownBlock"

function renderBlock(overrides: Partial<Parameters<typeof MarkdownBlock>[0]> = {}) {
  const props = {
    content: "# Notes",
    editing: false,
    blockNumber: 1,
    onChange: vi.fn(),
    onEdit: vi.fn(),
    onDone: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  }
  render(<MarkdownBlock {...props} />)
  return props
}

describe("MarkdownBlock", () => {
  it("renders an empty-block hint and opens the editor", () => {
    const props = renderBlock({ content: "" })

    expect(screen.getByText(/Empty block/)).toBeInTheDocument()
    fireEvent.doubleClick(screen.getByRole("button", { name: /Markdown block/ }))
    expect(props.onEdit).toHaveBeenCalledOnce()

    fireEvent.keyDown(screen.getByRole("button", { name: /Markdown block/ }), {
      key: "Enter",
    })
    expect(props.onEdit).toHaveBeenCalledTimes(2)
  })

  it("renders markdown and deletes from preview mode", () => {
    const props = renderBlock()

    expect(screen.getByRole("heading", { name: "Notes" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Delete block 1" }))
    expect(props.onDelete).toHaveBeenCalledOnce()
  })

  it("edits source text and finishes with Escape or Done", () => {
    const props = renderBlock({ editing: true, content: "# Draft" })
    const textarea = screen.getByLabelText("Markdown source")

    fireEvent.change(textarea, { target: { value: "# Updated" } })
    fireEvent.keyDown(textarea, { key: "Escape" })
    fireEvent.click(screen.getByRole("button", { name: "Done" }))

    expect(props.onChange).toHaveBeenCalledWith("# Updated")
    expect(props.onDone).toHaveBeenCalledTimes(2)
  })

  it("deletes while editing", () => {
    const props = renderBlock({ editing: true })

    fireEvent.click(screen.getByRole("button", { name: "Delete block 1" }))

    expect(props.onDelete).toHaveBeenCalledOnce()
  })
})
