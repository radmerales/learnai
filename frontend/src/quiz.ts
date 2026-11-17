import { uid } from "./graph"

export type QuizQuestion = {
  id: string
  prompt: string
  options: string[]
  answerIndex: number
}

export const MIN_QUIZ_OPTIONS = 2
const DEFAULT_QUIZ_OPTIONS = 4

/** New questions start with four empty MCQ options and the first marked correct. */
export function createQuestion(): QuizQuestion {
  return {
    id: uid(),
    prompt: "",
    options: Array.from({ length: DEFAULT_QUIZ_OPTIONS }, () => ""),
    answerIndex: 0,
  }
}

export function updateOption(question: QuizQuestion, optionIndex: number, value: string): QuizQuestion {
  return {
    ...question,
    options: question.options.map((option, index) => (index === optionIndex ? value : option)),
  }
}

export function addOption(question: QuizQuestion): QuizQuestion {
  return { ...question, options: [...question.options, ""] }
}

/**
 * Drop blank choices when the author finishes a question. The answer index
 * follows its option; if the marked option was blank, it falls back to the
 * first remaining choice. Questions with fewer than two filled choices are
 * left untouched so incomplete drafts are not silently broken.
 */
export function finalizeQuestion(question: QuizQuestion): QuizQuestion {
  const kept = question.options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => option.trim())

  if (kept.length < MIN_QUIZ_OPTIONS) return question

  const answerIndex = kept.findIndex(({ index }) => index === question.answerIndex)
  return {
    ...question,
    options: kept.map(({ option }) => option),
    answerIndex: answerIndex === -1 ? 0 : answerIndex,
  }
}

/**
 * Remove an option while keeping `answerIndex` pointing at the same answer.
 * Removing the correct option moves the mark to the nearest remaining option.
 */
export function deleteOption(question: QuizQuestion, optionIndex: number): QuizQuestion {
  if (question.options.length <= MIN_QUIZ_OPTIONS) return question

  const options = question.options.filter((_, index) => index !== optionIndex)
  let answerIndex = question.answerIndex
  if (optionIndex < answerIndex) {
    answerIndex -= 1
  } else if (optionIndex === answerIndex) {
    answerIndex = Math.min(answerIndex, options.length - 1)
  }

  return { ...question, options, answerIndex }
}
