import { describe, expect, it } from "vitest"

import {
  MIN_QUIZ_OPTIONS,
  addOption,
  createQuestion,
  deleteOption,
  finalizeQuestion,
  updateOption,
} from "./quiz"

describe("quiz question helpers", () => {
  it("creates a four-option question with the first answer marked", () => {
    const question = createQuestion()

    expect(question.id).not.toBe("")
    expect(question.prompt).toBe("")
    expect(question.options).toHaveLength(4)
    expect(question.answerIndex).toBe(0)
  })

  it("updates one option without mutating the original", () => {
    const question = createQuestion()
    const updated = updateOption(question, 1, "Mitochondria")

    expect(updated.options[1]).toBe("Mitochondria")
    expect(updated).not.toBe(question)
    expect(question.options[1]).toBe("")
  })

  it("appends a blank option", () => {
    const updated = addOption(createQuestion())

    expect(updated.options).toHaveLength(5)
    expect(updated.options[4]).toBe("")
  })

  it("keeps the same answer when an earlier option is deleted", () => {
    const question = { ...createQuestion(), answerIndex: 2 }

    const updated = deleteOption(question, 0)

    expect(updated.options).toHaveLength(3)
    expect(updated.answerIndex).toBe(1)
  })

  it("moves the answer mark when the correct option is deleted", () => {
    const question = { ...createQuestion(), answerIndex: 0 }

    const updated = deleteOption(question, 0)

    expect(updated.answerIndex).toBe(0)
    expect(updated.options).toHaveLength(3)
  })

  it("never removes an option below the minimum", () => {
    let question = createQuestion()
    while (question.options.length > MIN_QUIZ_OPTIONS) {
      question = deleteOption(question, 0)
    }

    expect(deleteOption(question, 0)).toBe(question)
  })

  it("drops blank choices and follows the correct answer", () => {
    const question = {
      ...createQuestion(),
      options: ["Cytosol", " ", "Mitochondria", ""],
      answerIndex: 2,
    }

    const finalized = finalizeQuestion(question)

    expect(finalized.options).toEqual(["Cytosol", "Mitochondria"])
    expect(finalized.answerIndex).toBe(1)
  })

  it("leaves questions with fewer than two filled choices unchanged", () => {
    const question = {
      ...createQuestion(),
      options: ["Only one", "", "", ""],
    }

    expect(finalizeQuestion(question)).toBe(question)
  })
})
