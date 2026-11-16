import { useState } from "react"

import { MarkdownBlock } from "./MarkdownBlock"

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  )
}

type Props = {
  blocks: string[]
  onChange: (blocks: string[]) => void
}

export function LearnTab({ blocks, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const isBlank = editingIndex === null && blocks.every((block) => !block.trim())

  function addBlock() {
    const base = isBlank ? [] : blocks
    const next = [...base, ""]
    onChange(next)
    setEditingIndex(next.length - 1)
  }

  function updateBlock(index: number, content: string) {
    onChange(blocks.map((block, blockIndex) => (blockIndex === index ? content : block)))
  }

  if (isBlank) {
    return (
      <div className="h-full overflow-y-auto px-3 py-3">
        <button
          type="button"
          onClick={addBlock}
          className="flex w-full items-center justify-center gap-2 border border-hairline px-3 py-3 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink hover:border-ink hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <PlusIcon />
          Click here to add new block
        </button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-3 py-3">
      <div className="space-y-2">
        {blocks.map((block, index) => (
          <MarkdownBlock
            key={index}
            content={block}
            editing={editingIndex === index}
            onChange={(content) => updateBlock(index, content)}
            onEdit={() => setEditingIndex(index)}
            onDone={() => setEditingIndex(null)}
          />
        ))}
      </div>

      <div className="group mt-2 border border-transparent hover:border-hairline">
        <button
          type="button"
          aria-label="Add markdown block"
          onClick={addBlock}
          className="flex h-10 w-full items-center justify-center gap-2 px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink opacity-0 hover:text-ink focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink group-hover:opacity-100"
        >
          <PlusIcon />
          Add block
        </button>
      </div>
    </div>
  )
}
