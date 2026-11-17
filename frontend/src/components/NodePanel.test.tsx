import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { QuizQuestion } from "../quiz"
import { makeNode } from "../test/fixtures"
import { NodePanel } from "./NodePanel"

const question: QuizQuestion = {
  id: "q1",
  prompt: "Where?",
  options: ["Cytosol", "Nucleus"],
  answerIndex: 0,
}

function renderPanel(overrides: Partial<Parameters<typeof NodePanel>[0]> = {}) {
  const props = {
    node: makeNode({ label: "Biology", blocks: ["# Notes"], questions: [question] }),
    onClose: vi.fn(),
    onTitleChange: vi.fn(),
    onBlocksChange: vi.fn(),
    onQuestionsChange: vi.fn(),
    onStatusChange: vi.fn(),
    ...overrides,
  }
  render(<NodePanel {...props} />)
  return props
}

describe("NodePanel", () => {
  it("shows Learn content by default and can switch to Quiz", () => {
    renderPanel()

    expect(screen.getByText("Notes")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("tab", { name: "Quiz" }))
    expect(screen.getByText("Where?")).toBeInTheDocument()
  })

  it("reports title, status, and close actions", () => {
    const props = renderPanel()

    fireEvent.change(screen.getByLabelText("Node title"), { target: { value: "Updated" } })
    fireEvent.click(screen.getByRole("button", { name: "Done" }))
    fireEvent.click(screen.getByRole("button", { name: "Close node panel" }))

    expect(props.onTitleChange).toHaveBeenCalledWith("Updated")
    expect(props.onStatusChange).toHaveBeenCalledWith("done")
    expect(props.onClose).toHaveBeenCalledOnce()
  })

  it("renders empty Learn/Quiz states", () => {
    renderPanel({ node: makeNode({ blocks: [""], questions: [] }) })

    expect(screen.getByRole("button", { name: /add new block/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("tab", { name: "Quiz" }))
    expect(screen.getByRole("button", { name: /add a new question/i })).toBeInTheDocument()
  })
})
