import { useState } from "react"

import { createQuestion, type QuizQuestion } from "../quiz"
import { PlusIcon } from "./PlusIcon"
import { QuizQuestionBlock } from "./QuizQuestionBlock"

type Props = {
  questions: QuizQuestion[]
  onChange: (questions: QuizQuestion[]) => void
}

export function NodeQuiz({ questions, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const answeredCount = Object.keys(answers).length

  function addQuestion() {
    const question = createQuestion()
    onChange([...questions, question])
    setEditingId(question.id)
  }

  function updateQuestion(next: QuizQuestion) {
    onChange(questions.map((question) => (question.id === next.id ? next : question)))
  }

  function deleteQuestion(id: string) {
    onChange(questions.filter((question) => question.id !== id))
    setEditingId(null)
    setAnswers((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  if (questions.length === 0) {
    return (
      <div className="h-full overflow-y-auto px-3 py-3">
        <button
          type="button"
          onClick={addQuestion}
          className="flex w-full items-center justify-center gap-2 border border-hairline px-3 py-3 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink hover:border-ink hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <PlusIcon />
          Click here to add a new question
        </button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-3 py-3">
      <div className="flex items-baseline justify-between gap-3 px-2 pb-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">
            Multiple choice
          </p>
          <p className="mt-1 text-sm text-[#3f3e3e]">Add questions, then pick one answer per question.</p>
        </div>
        {answeredCount > 0 && (
          <button
            type="button"
            onClick={() => setAnswers({})}
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink underline decoration-hairline underline-offset-4 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-2">
        {questions.map((question, index) => (
          <QuizQuestionBlock
            key={question.id}
            question={question}
            index={index}
            editing={editingId === question.id}
            answer={answers[question.id]}
            onChange={updateQuestion}
            onAnswer={(optionIndex) =>
              setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))
            }
            onEdit={() => setEditingId(question.id)}
            onDone={() => setEditingId(null)}
            onDelete={() => deleteQuestion(question.id)}
          />
        ))}
      </div>

      <div className="group mt-2 border border-transparent hover:border-hairline">
        <button
          type="button"
          aria-label="Add quiz question"
          onClick={addQuestion}
          className="flex h-10 w-full items-center justify-center gap-2 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink opacity-0 hover:text-ink focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink group-hover:opacity-100"
        >
          <PlusIcon />
          Add question
        </button>
      </div>
    </div>
  )
}
