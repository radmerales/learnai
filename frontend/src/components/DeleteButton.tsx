import { TrashIcon } from "./TrashIcon"
import { DANGER_BUTTON_CLASS } from "./buttonStyles"

type Props = {
  /** Accessible name, e.g. "Delete block 2". */
  label: string
  title?: string
  onClick: () => void
  className?: string
}

/**
 * Shared destructive action used by Learn blocks and Quiz questions.
 * It stops pointer events from bubbling so clicking Delete does not also
 * select the surrounding block or start a drag.
 */
export function DeleteButton({ label, title = "Delete", onClick, className = "" }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      onDoubleClick={(event) => event.stopPropagation()}
      className={`${DANGER_BUTTON_CLASS} ${className}`}
    >
      <TrashIcon size={13} strokeWidth={1.25} />
      Delete
    </button>
  )
}
