import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { QuizQuestion } from "../quiz"
import { NodeQuiz } from "./NodeQuiz"

const question: QuizQuestion = {
  id: "q1",
  prompt: "Where does glycolysis happen?",
  options: ["Cytosol", "Mitochondria", "Nucleus"],
  answerIndex: 0,
}

describe("NodeQuiz", () => {
  it("shows the add-question action when there are no questions", () => {
    const onChange = vi.fn()
    render(<NodeQuiz questions={[]} onChange={onChange} />)

    fireEvent.click(
      screen.getByRole("button", { name: /click here to add a new question/i }),
    )

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toHaveLength(1)
    expect(onChange.mock.calls[0][0][0].options).toHaveLength(4)
  })

  it("confirms a correct answer", () => {
    render(<NodeQuiz questions={[question]} onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Cytosol" }))

    expect(screen.getByText("Correct")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cytosol" })).toBeDisabled()
  })

  it("reveals the correct option after a wrong answer", () => {
    render(<NodeQuiz questions={[question]} onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Nucleus" }))

    expect(screen.getByText("Correct answer: Cytosol")).toBeInTheDocument()
  })

  it("opens the editor and reports prompt edits", () => {
    const onChange = vi.fn()
    render(<NodeQuiz questions={[question]} onChange={onChange} />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    fireEvent.change(screen.getByLabelText("Question"), {
      target: { value: "Updated prompt?" },
    })

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: "q1", prompt: "Updated prompt?" }),
    ])
  })
})
