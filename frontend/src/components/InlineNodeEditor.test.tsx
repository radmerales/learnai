import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { InlineNodeEditor } from "./InlineNodeEditor"
import { makeNode } from "../test/fixtures"

describe("InlineNodeEditor", () => {
  it("renders the current value and style", () => {
    const node = makeNode({ x: 100, y: 80, width: 180 })
    render(
      <InlineNodeEditor
        node={node}
        viewport={{ x: 0, y: 0, scale: 1 }}
        value="Biology"
        onChange={vi.fn()}
        onCommit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    const input = screen.getByLabelText("Node label")
    expect(input).toHaveValue("Biology")
    expect(input).toHaveStyle({ left: "10px", top: "58px", width: "180px", height: "44px" })
  })

  it("reports changes, Enter, Escape, and blur", () => {
    const onChange = vi.fn()
    const onCommit = vi.fn()
    const onCancel = vi.fn()
    render(
      <InlineNodeEditor
        node={makeNode()}
        viewport={{ x: 0, y: 0, scale: 1 }}
        value="Node 1"
        onChange={onChange}
        onCommit={onCommit}
        onCancel={onCancel}
      />,
    )

    const input = screen.getByLabelText("Node label")
    fireEvent.change(input, { target: { value: "Updated" } })
    fireEvent.keyDown(input, { key: "Enter" })
    fireEvent.keyDown(input, { key: "Escape" })
    fireEvent.blur(input)

    expect(onChange).toHaveBeenCalledWith("Updated")
    expect(onCommit).toHaveBeenCalledTimes(2)
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
