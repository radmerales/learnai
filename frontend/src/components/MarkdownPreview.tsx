import type { ReactNode } from "react"

import { renderMarkdownLine } from "../markdown"

type Props = {
  content: string
}

export function MarkdownPreview({ content }: Props) {
  const lines = content.split("\n")
  const blocks: ReactNode[] = []
  let code: string[] | null = null
  let codeStart = 0

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]

    if (line.trim().startsWith("```")) {
      if (code === null) {
        code = []
        codeStart = index
      } else {
        blocks.push(
          <pre key={`code-${codeStart}`} className="overflow-x-auto bg-surface p-3 font-mono text-xs leading-5 text-ink">
            {code.join("\n")}
          </pre>,
        )
        code = null
      }
      continue
    }

    if (code) {
      code.push(line)
      continue
    }

    if (!line.trim()) {
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

  if (blocks.length === 0) {
    return <p className="text-sm text-mutedink">Nothing here yet. Use Edit to start writing markdown.</p>
  }

  return <div className="space-y-1">{blocks}</div>
}
