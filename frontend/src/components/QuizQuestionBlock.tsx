import type { KeyboardEvent } from "react"

import {
  MIN_QUIZ_OPTIONS,
  addOption,
  deleteOption,
  finalizeQuestion,
  updateOption,
  type QuizQuestion,
} from "../quiz"
import { DeleteButton } from "./DeleteButton"
import { PlusIcon } from "./PlusIcon"
import { TrashIcon } from "./TrashIcon"
import { SMALL_BUTTON_CLASS } from "./buttonStyles"

type Props = {
  question: QuizQuestion
  index: number
  editing: boolean
  answer: number | undefined
  onChange: (question: QuizQuestion) => void
  onAnswer: (optionIndex: number) => void
  onEdit: () => void
  onDone: () => void
  onDelete: () => void
}

const fieldClass =
  "w-full border border-hairline bg-surface px-2.5 py-1.5 text-sm text-ink outline-none placeholder:text-mutedink focus-visible:border-ink focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ink"

export function QuizQuestionBlock({
  question,
  index,
  editing,
  answer,
  onChange,
  onAnswer,
  onEdit,
  onDone,
  onDelete,
}: Props) {
  function finishEditing() {
    onChange(finalizeQuestion(question))
    onDone()
  }

  function handleCommitKey(event: KeyboardEvent) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      finishEditing()
    }
  }

  if (editing) {
    return (
      <div className="border border-ink bg-paper">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-3 py-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">
            Editing question {index + 1}
          </p>
          <div className="flex items-center gap-1.5">
            <DeleteButton
              label={`Delete question ${index + 1}`}
              title="Delete question"
              onClick={onDelete}
            />
            <button type="button" onClick={finishEditing} className={SMALL_BUTTON_CLASS}>
              Done
            </button>
          </div>
        </div>

        <div className="space-y-4 px-3 py-3">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">
              Question
            </span>
            <textarea
              aria-label="Question"
              rows={2}
              value={question.prompt}
              placeholder="Type the question"
              onChange={(e) => onChange({ ...question, prompt: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault()
                  finishEditing()
                } else {
                  handleCommitKey(e)
                }
              }}
              className={`mt-1.5 resize-y leading-5 ${fieldClass}`}
            />
          </label>

          <fieldset>
            <legend className="font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">
              Answers · select the correct one
            </legend>
            <div className="mt-1.5 space-y-2">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.answerIndex === optionIndex}
                    onChange={() => onChange({ ...question, answerIndex: optionIndex })}
                    aria-label={`Mark option ${optionIndex + 1} as correct`}
                    className="h-4 w-4 shrink-0 accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  />
                  <input
                    type="text"
                    value={option}
                    placeholder={`Option ${optionIndex + 1}`}
                    aria-label={`Option ${optionIndex + 1}`}
                    onChange={(e) => onChange(updateOption(question, optionIndex, e.target.value))}
                    onKeyDown={handleCommitKey}
                    className={fieldClass}
                  />
                  <button
                    type="button"
                    title="Delete option"
                    aria-label={`Delete option ${optionIndex + 1}`}
                    disabled={question.options.length <= MIN_QUIZ_OPTIONS}
                    onClick={() => onChange(deleteOption(question, optionIndex))}
                    className="shrink-0 border border-hairline p-1.5 text-mutedink hover:border-red-700 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-hairline disabled:hover:text-mutedink"
                  >
                    <TrashIcon size={13} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onChange(addOption(question))}
              className={`mt-2 inline-flex items-center gap-1.5 ${SMALL_BUTTON_CLASS}`}
            >
              <PlusIcon />
              Add answer
            </button>
          </fieldset>
        </div>
      </div>
    )
  }

  const answered = answer !== undefined
  const visibleOptions = question.options
    .map((option, optionIndex) => ({ option, optionIndex }))
    .filter(({ option }) => option.trim())

  return (
    <div className="group relative border border-transparent hover:border-hairline focus-within:border-hairline">
      <div className="absolute right-2 top-2 z-10 flex gap-1.5 opacity-0 focus-within:opacity-100 group-hover:opacity-100">
        <button type="button" onClick={onEdit} className={SMALL_BUTTON_CLASS}>
          Edit
        </button>
        <DeleteButton
          label={`Delete question ${index + 1}`}
          title="Delete question"
          onClick={onDelete}
        />
      </div>

      <div className="px-3 py-2 pr-32">
        <p
          onDoubleClick={onEdit}
          title="Double-click to edit"
          className="cursor-text text-sm font-medium leading-5 text-ink"
        >
          <span className="mr-2 font-mono text-xs text-mutedink">{index + 1}.</span>
          {question.prompt.trim() ? (
            question.prompt
          ) : (
            <span className="text-mutedink">Empty question. Double-click to edit.</span>
          )}
        </p>

        {visibleOptions.length > 0 && (
          <div className="mt-3 space-y-2">
            {visibleOptions.map(({ option, optionIndex }) => {
              const isCorrectAnswer = answered && optionIndex === question.answerIndex
              const isWrongPick =
                answered && answer === optionIndex && optionIndex !== question.answerIndex
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
                  onClick={() => onAnswer(optionIndex)}
                  className={`w-full border px-3 py-2 text-left text-sm leading-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-default ${tone}`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        )}

        {answered && (
          <p
            aria-live="polite"
            className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink"
          >
            {answer === question.answerIndex
              ? "Correct"
              : `Correct answer: ${question.options[question.answerIndex] ?? ""}`}
          </p>
        )}
      </div>
    </div>
  )
}
