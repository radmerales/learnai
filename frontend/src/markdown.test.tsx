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

  it("renders inline formatting tokens", () => {
    const { container } = render(
      <MarkdownPreview content={"`code` **bold** *em* ~~gone~~ ==mark=="} />,
    )

    expect(container.querySelector("code")).toHaveTextContent("code")
    expect(container.querySelector("strong")).toHaveTextContent("bold")
    expect(container.querySelector("em")).toHaveTextContent("em")
    expect(container.querySelector("del")).toHaveTextContent("gone")
    expect(container.querySelector("mark")).toHaveTextContent("mark")
  })

  it("renders task lists, ordered lists, quotes, rules, and indented code", () => {
    const { container } = render(
      <MarkdownPreview
        content={"- [x] Finished\n- [ ] Pending\n\n1. First\n\n> Quoted\n\n---\n\n    const x = 1"}
      />,
    )

    expect(screen.getByText("Finished")).toBeInTheDocument()
    expect(screen.getByText("Pending")).toBeInTheDocument()
    expect(screen.getByText("First")).toBeInTheDocument()
    expect(container.querySelector("blockquote")).toHaveTextContent("Quoted")
    expect(container.querySelector("hr")).not.toBeNull()
    expect(container.querySelector("pre")).toHaveTextContent("const x = 1")
  })

  it("renders inline and fenced display math with KaTeX", () => {
    const { container } = render(
      <MarkdownPreview content={"Inline $x^2$ math\n\n$$\n\\frac{1}{2}\n$$"} />,
    )

    expect(container.querySelectorAll(".katex").length).toBeGreaterThan(0)
    expect(container.querySelector(".katex-display")).not.toBeNull()
  })

  it("shows a placeholder for empty content", () => {
    render(<MarkdownPreview content="" />)

    expect(screen.getByText(/Nothing here yet/)).toBeInTheDocument()
  })
})
