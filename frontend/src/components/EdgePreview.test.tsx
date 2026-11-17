import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { makeNode } from "../test/fixtures"
import { EdgePreview } from "./EdgePreview"

describe("EdgePreview", () => {
  it("renders a ghost node and preview curves with markers", () => {
    const preview = {
      path: "M 0 0 C 10 0, 20 0, 30 0",
      start: { x: 0, y: 0 },
      end: { x: 30, y: 0 },
    }
    const { container } = render(
      <svg>
        <EdgePreview
          ghostNode={makeNode({ id: "__ghost__", label: "New node", x: 200, y: 100 })}
          connectPreview={preview}
          edgePreview={preview}
        />
      </svg>,
    )

    expect(screen.getByText("New node")).toBeInTheDocument()
    expect(container.querySelectorAll("path")).toHaveLength(2)
    expect(container.querySelectorAll("circle")).toHaveLength(4)
  })

  it("renders nothing when there is no preview", () => {
    const { container } = render(
      <svg>
        <EdgePreview ghostNode={null} connectPreview={null} edgePreview={null} />
      </svg>,
    )

    expect(container.querySelector("g")).toBeNull()
  })
})
