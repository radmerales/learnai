import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MarkdownPreview } from "./components/MarkdownPreview"

describe("markdown preview", () => {
  it("renders headings, emphasis, and lists", () => {
    render(
      <MarkdownPreview content={"# Respiration\n\n**Important** ATP\n\n- Glycolysis"} />,
    )

    expect(screen.getByRole("heading", { level: 1, name: "Respiration" })).toBeInTheDocument()
    expect(screen.getByText("Important")).toBeInTheDocument()
    expect(screen.getByText("Glycolysis")).toBeInTheDocument()
  })

  it("renders fenced code as preformatted text", () => {
    render(<MarkdownPreview content={"```\nconst x = 1\n```"} />)

    expect(screen.getByText("const x = 1")).toBeInTheDocument()
  })

  it("keeps safe links clickable", () => {
    render(<MarkdownPreview content={"[Docs](https://example.com)"} />)

    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "href",
      "https://example.com",
    )
  })

  it("does not create links for unsafe protocols", () => {
    render(<MarkdownPreview content={"[Click](javascript:alert(1))"} />)

    expect(screen.getByText("Click")).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
