import type { ReactNode } from "react"

import { Latex } from "./components/Latex"

function safeHref(url: string): string | undefined {
  return /^(https?:\/\/|mailto:|#)/i.test(url) ? url : undefined
}

export function parseInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(`[^`]+`|\$[^$\n]+\$|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|==[^=]+==|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g
  let lastIndex = 0
  let key = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    const token = match[0]

    if (token.startsWith("`")) {
      nodes.push(
        <code key={`code-${key++}`} className="bg-surface px-1 py-0.5 font-mono text-[0.9em] text-ink">
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith("$")) {
      nodes.push(<Latex key={`math-${key++}`} formula={token.slice(1, -1)} />)
    } else if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(
        <strong key={`strong-${key++}`} className="font-semibold">
          {parseInlineMarkdown(token.slice(2, -2))}
        </strong>,
      )
    } else if (token.startsWith("~~")) {
      nodes.push(
        <del key={`del-${key++}`} className="text-mutedink">
          {parseInlineMarkdown(token.slice(2, -2))}
        </del>,
      )
    } else if (token.startsWith("==")) {
      nodes.push(
        <mark key={`mark-${key++}`} className="bg-accent px-0.5 text-accentink">
          {parseInlineMarkdown(token.slice(2, -2))}
        </mark>,
      )
    } else if (token.startsWith("[") && token.includes("](")) {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link) {
        const href = safeHref(link[2])
        const content = parseInlineMarkdown(link[1])
        nodes.push(
          href ? (
            <a
              key={`link-${key++}`}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-ink underline decoration-ink underline-offset-2 hover:text-mutedink"
            >
              {content}
            </a>
          ) : (
            <span key={`link-${key++}`}>{content}</span>
          ),
        )
      }
    } else if (token.startsWith("*") || token.startsWith("_")) {
      nodes.push(
        <em key={`em-${key++}`} className="italic">
          {parseInlineMarkdown(token.slice(1, -1))}
        </em>,
      )
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

const HEADING_CLASSES = [
  "text-xl font-semibold leading-7",
  "text-lg font-semibold leading-6",
  "text-base font-semibold leading-6",
  "text-sm font-semibold leading-5",
  "text-sm font-semibold leading-5",
  "text-sm font-semibold leading-5",
]

export function renderMarkdownLine(line: string): ReactNode {
  const displayMath = line.trim().match(/^\$\$(.+)\$\$$/)
  if (displayMath) {
    return (
      <div className="my-2 overflow-x-auto text-center">
        <Latex formula={displayMath[1]} displayMode />
      </div>
    )
  }

  const heading = line.match(/^(#{1,6})\s+(.*)$/)
  if (heading) {
    const level = heading[1].length
    const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
    return <Tag className={`my-1 text-ink ${HEADING_CLASSES[level - 1]}`}>{parseInlineMarkdown(heading[2])}</Tag>
  }

  const task = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/)
  if (task) {
    const checked = task[2].toLowerCase() === "x"
    return (
      <div
        className="flex items-start gap-2 text-sm leading-6 text-ink"
        style={{ paddingLeft: `${Math.min(task[1].length, 6) * 12}px` }}
      >
        <span className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center border border-ink text-[10px] leading-none">
          {checked ? "✓" : ""}
        </span>
        <span className={checked ? "text-mutedink line-through" : ""}>{parseInlineMarkdown(task[3])}</span>
      </div>
    )
  }

  const unordered = line.match(/^(\s*)[-*+]\s+(.*)$/)
  if (unordered) {
    return (
      <div
        className="flex items-start gap-2 text-sm leading-6 text-ink"
        style={{ paddingLeft: `${Math.min(unordered[1].length, 6) * 12}px` }}
      >
        <span className="mt-2.5 h-1 w-1 shrink-0 bg-ink" />
        <span>{parseInlineMarkdown(unordered[2])}</span>
      </div>
    )
  }

  const ordered = line.match(/^(\s*)(\d+)\.\s+(.*)$/)
  if (ordered) {
    return (
      <div
        className="flex items-start gap-2 text-sm leading-6 text-ink"
        style={{ paddingLeft: `${Math.min(ordered[1].length, 6) * 12}px` }}
      >
        <span className="shrink-0 font-mono text-xs leading-6 text-mutedink">{ordered[2]}.</span>
        <span>{parseInlineMarkdown(ordered[3])}</span>
      </div>
    )
  }

  const quote = line.match(/^>\s?(.*)$/)
  if (quote) {
    return (
      <blockquote className="border-l-2 border-hairline pl-3 text-sm italic leading-6 text-mutedink">
        {parseInlineMarkdown(quote[1])}
      </blockquote>
    )
  }

  if (/^---+$/.test(line.trim())) return <hr className="my-2 border-hairline" />

  if (/^ {4}/.test(line)) {
    return (
      <pre className="overflow-x-auto bg-surface px-2 py-1 font-mono text-xs leading-5 text-ink">
        {line.replace(/^ {4}/, "")}
      </pre>
    )
  }

  return <span className="text-sm leading-6 text-ink">{parseInlineMarkdown(line)}</span>
}
