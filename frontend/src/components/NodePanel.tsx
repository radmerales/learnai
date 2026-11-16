import type { Node } from "../graph"

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    >
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  )
}

type Props = {
  node: Node
  onClose: () => void
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
}

export function NodePanel({ node, onClose, onTitleChange, onContentChange }: Props) {
  return (
    <aside
      aria-label="Node notes"
      className="absolute inset-y-0 right-0 z-30 flex w-full flex-col border-l border-ink bg-paper md:w-1/2"
    >
      <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
        <div className="min-w-0 flex-1">
          <input
            aria-label="Node title"
            value={node.label}
            onChange={(e) => onTitleChange(e.target.value)}
            className="mt-2 w-full border-b border-transparent bg-transparent text-2xl font-semibold leading-tight text-ink outline-none focus:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          />
        </div>
        <button
          type="button"
          aria-label="Close node panel"
          onClick={onClose}
          className="shrink-0 border border-hairline bg-paper p-2 text-ink hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <CloseIcon />
        </button>
      </div>

      <label className="flex min-h-0 flex-1 flex-col px-5 py-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink">Contents</span>
        <textarea
          aria-label="Node contents"
          value={node.content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Write notes for this node…"
          className="mt-3 min-h-0 flex-1 resize-none border-0 bg-transparent font-sans text-sm leading-6 text-ink outline-none placeholder:text-[#6b6a6a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        />
      </label>
    </aside>
  )
}
