import { useMemo } from "react"

import katex from "katex"
import "katex/dist/katex.min.css"

type Props = {
  formula: string
  displayMode?: boolean
}

export function Latex({ formula, displayMode = false }: Props) {
  const html = useMemo(
    () =>
      katex.renderToString(formula, {
        displayMode,
        throwOnError: false,
        strict: false,
        trust: false,
        errorColor: "#b91c1c",
      }),
    [displayMode, formula],
  )

  if (!formula.trim()) return null

  return <span className={displayMode ? "block text-center" : "inline"} dangerouslySetInnerHTML={{ __html: html }} />
}
