import { useMemo, useState } from "react"

import { createSampleQuiz } from "../quiz"

type Props = {
  nodeLabel: string
}

export function NodeQuiz({ nodeLabel }: Props) {
  const quiz = useMemo(() => createSampleQuiz(nodeLabel), [nodeLabel])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const answeredCount = Object.keys(answers).length

  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">Sample quiz</p>
          <p className="mt-1 text-sm text-[#3f3e3e]">A three-item placeholder for this node.</p>
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

      <ol className="mt-5 space-y-6">
        {quiz.questions.map((question, questionIndex) => {
          const answer = answers[question.id]
          const answered = answer !== undefined

          return (
            <li key={question.id}>
              <p className="text-sm font-medium leading-5 text-ink">
                <span className="mr-2 font-mono text-xs text-mutedink">{questionIndex + 1}.</span>
                {question.prompt}
              </p>

              <div className="mt-3 space-y-2">
                {question.options.map((option, optionIndex) => {
                  const isCorrectAnswer = answered && optionIndex === question.answerIndex
                  const isWrongPick = answered && answer === optionIndex && optionIndex !== question.answerIndex
                  const tone = isCorrectAnswer
                    ? "border-ink bg-accent text-accentink"
                    : isWrongPick
                      ? "border-red-700 bg-red-600 text-white"
                      : "border-hairline bg-paper text-ink enabled:hover:bg-surface"

                  return (
                    <button
                      key={optionIndex}
                      type="button"
                      disabled={answered}
                      aria-pressed={answer === optionIndex}
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                      className={`w-full border px-3 py-2 text-left text-sm leading-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-default ${tone}`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>

              {answered && (
                <p
                  aria-live="polite"
                  className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink"
                >
                  {answer === question.answerIndex
                    ? "Correct"
                    : `Correct answer: ${question.options[question.answerIndex]}`}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
