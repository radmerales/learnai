export type QuizQuestion = {
  id: string
  prompt: string
  options: string[]
  answerIndex: number
}

export type Quiz = {
  title: string
  questions: QuizQuestion[]
}

/**
 * Basic quiz template.
 *
 * To define a quiz, add questions with a stable `id`, a prompt, an options
 * array, and the zero-based index of the correct option. The sample below is
 * generated for every node until custom node quizzes are persisted.
 */
export function createSampleQuiz(nodeLabel: string): Quiz {
  return {
    title: `${nodeLabel} — sample quiz`,
    questions: [
      {
        id: "q1",
        prompt: "Which concept is this quiz attached to?",
        options: [nodeLabel, "A deleted edge", "An unrelated note", "An empty canvas"],
        answerIndex: 0,
      },
      {
        id: "q2",
        prompt: "What is the best next step after adding a node?",
        options: [
          "Write notes and connect related ideas",
          "Delete all of its edges",
          "Close the panel immediately",
          "Ignore the node",
        ],
        answerIndex: 0,
      },
      {
        id: "q3",
        prompt: "Which panel tab holds the node's markdown notes?",
        options: ["Learn", "Quiz", "Close", "Canvas"],
        answerIndex: 0,
      },
    ],
  }
}
