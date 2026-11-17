import type { ReactNode } from "react"

import { renderMarkdownLine } from "../markdown"
import { Latex } from "./Latex"

type Props = {
  content: string
}

export function MarkdownPreview({ content }: Props) {
  if (!content.trim()) {
    return <p className="text-sm text-mutedink">Nothing here yet. Use Edit to start writing markdown.</p>
  }

  const lines = content.split("\n")
  const blocks: ReactNode[] = []
  let code: string[] | null = null
  let codeStart = 0
  let math: string[] | null = null
  let mathStart = 0

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim()

    if (code) {
      if (trimmed.startsWith("```")) {
        blocks.push(
          <pre key={`code-${codeStart}`} className="overflow-x-auto bg-surface p-3 font-mono text-xs leading-5 text-ink">
            {code.join("\n")}
          </pre>,
        )
        code = null
      } else {
        code.push(line)
      }
      continue
    }

    if (math) {
      if (trimmed === "$$") {
        blocks.push(
          <div key={`math-${mathStart}`} className="my-2 overflow-x-auto text-center">
            <Latex formula={math.join("\n")} displayMode />
          </div>,
        )
        math = null
      } else {
        math.push(line)
      }
      continue
    }

    if (trimmed.startsWith("```")) {
      code = []
      codeStart = index
      continue
    }

    if (trimmed === "$$") {
      math = []
      mathStart = index
      continue
    }

    if (!trimmed) {
      blocks.push(<div key={`blank-${index}`} className="h-2" />)
      continue
    }

    blocks.push(<div key={`line-${index}`}>{renderMarkdownLine(line)}</div>)
  }

  if (code) {
    blocks.push(
      <pre key={`code-${codeStart}`} className="overflow-x-auto bg-surface p-3 font-mono text-xs leading-5 text-ink">
        {code.join("\n")}
      </pre>,
    )
  }

  if (math) {
    blocks.push(
      <div key={`math-${mathStart}`} className="my-2 overflow-x-auto text-center">
        <Latex formula={math.join("\n")} displayMode />
      </div>,
    )
  }

  return <div className="space-y-1">{blocks}</div>
}
