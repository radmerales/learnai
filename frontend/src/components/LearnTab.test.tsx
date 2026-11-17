import { useState } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { LearnTab } from "./LearnTab"

function Harness({ initial }: { initial: string[] }) {
  const [blocks, setBlocks] = useState(initial)
  return <LearnTab blocks={blocks} onChange={setBlocks} />
}

describe("LearnTab", () => {
  it("adds and edits the first markdown block", () => {
    render(<Harness initial={[""]} />)

    fireEvent.click(screen.getByRole("button", { name: /add new block/i }))
    fireEvent.change(screen.getByLabelText("Markdown source"), {
      target: { value: "# Hello" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Done" }))

    expect(screen.getByRole("heading", { level: 1, name: "Hello" })).toBeInTheDocument()
  })

  it("opens an existing block for editing and commits changes", () => {
    render(<Harness initial={["# First", "# Second"]} />)

    fireEvent.doubleClick(
      screen.getAllByRole("button", { name: /Markdown block/ })[0],
    )
    const textarea = screen.getByLabelText("Markdown source")
    expect(textarea).toHaveValue("# First")

    fireEvent.change(textarea, { target: { value: "## Updated" } })
    fireEvent.click(screen.getByRole("button", { name: "Done" }))

    expect(screen.getByRole("heading", { level: 2, name: "Updated" })).toBeInTheDocument()
  })

  it("deletes a block and can add another", () => {
    render(<Harness initial={["# First", "# Second"]} />)

    fireEvent.click(screen.getByRole("button", { name: "Delete block 1" }))

    expect(screen.queryByRole("heading", { name: "First" })).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Second" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Add markdown block" }))
    expect(screen.getByLabelText("Markdown source")).toBeInTheDocument()
  })
})
