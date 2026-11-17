import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MindmapFooter } from "./MindmapFooter"

const baseProps = {
  selectedLabel: null,
  selectedNodeCount: 0,
  selectedEdgeCount: 0,
  nodeCount: 2,
  linkCount: 1,
}

describe("MindmapFooter", () => {
  it("shows map counts when nothing is selected", () => {
    render(<MindmapFooter {...baseProps} />)

    expect(screen.getByText(/2 nodes · 1 link/)).toBeInTheDocument()
  })

  it("describes a single selected node", () => {
    render(<MindmapFooter {...baseProps} selectedLabel="Biology" selectedNodeCount={1} />)

    expect(screen.getByText(/Selected:/)).toBeInTheDocument()
    expect(screen.getByText("Biology")).toBeInTheDocument()
  })

  it("describes a single selected edge", () => {
    render(<MindmapFooter {...baseProps} selectedEdgeCount={1} />)

    expect(screen.getByText(/Edge selected/)).toBeInTheDocument()
  })

  it("describes a multi-selection", () => {
    render(<MindmapFooter {...baseProps} selectedNodeCount={2} selectedEdgeCount={1} />)

    expect(screen.getByText(/2 nodes · 1 edge selected/)).toBeInTheDocument()
    expect(screen.getByText(/drag a selected node/)).toBeInTheDocument()
  })

  it("tells an edge-only multi-selection how to delete", () => {
    render(<MindmapFooter {...baseProps} selectedEdgeCount={2} />)

    expect(screen.getByText(/press Delete or Backspace/)).toBeInTheDocument()
  })
})
