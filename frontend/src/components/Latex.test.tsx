import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Latex } from "./Latex"

describe("Latex", () => {
  it("renders inline KaTeX", () => {
    const { container } = render(<Latex formula="x^2" />)

    expect(container.querySelector(".katex")).not.toBeNull()
    expect(container.querySelector("span.inline")).not.toBeNull()
  })

  it("renders block KaTeX", () => {
    const { container } = render(<Latex formula="\\frac{1}{2}" displayMode />)

    expect(container.querySelector(".katex-display")).not.toBeNull()
    expect(container.querySelector("span.block")).not.toBeNull()
  })

  it("renders nothing for a blank formula", () => {
    const { container } = render(<Latex formula="   " />)

    expect(container).toBeEmptyDOMElement()
  })
})
