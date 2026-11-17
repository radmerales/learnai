import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CanvasStatusOverlay } from "./CanvasStatusOverlay"

function renderOverlay(
  overrides: Partial<Parameters<typeof CanvasStatusOverlay>[0]> = {},
) {
  const props = {
    loading: false,
    error: null,
    isEmpty: false,
    onRetry: vi.fn(),
    onCreateFirstNode: vi.fn(),
    ...overrides,
  }
  render(<CanvasStatusOverlay {...props} />)
  return props
}

describe("CanvasStatusOverlay", () => {
  it("renders nothing when the map is ready and has nodes", () => {
    renderOverlay()

    expect(screen.queryByText("Loading map")).not.toBeInTheDocument()
    expect(screen.queryByText("Empty canvas")).not.toBeInTheDocument()
  })

  it("shows a loading state instead of the empty state", () => {
    renderOverlay({ loading: true, isEmpty: true })

    expect(screen.getByText("Loading map")).toBeInTheDocument()
    expect(screen.queryByText("Empty canvas")).not.toBeInTheDocument()
  })

  it("shows the empty state and creates the first node", () => {
    const props = renderOverlay({ isEmpty: true })

    fireEvent.click(screen.getByRole("button", { name: "Create first node" }))

    expect(props.onCreateFirstNode).toHaveBeenCalledTimes(1)
  })

  it("shows a load error with retry", () => {
    const props = renderOverlay({ error: "Backend unavailable" })

    expect(screen.getByText("Backend unavailable")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))

    expect(props.onRetry).toHaveBeenCalledTimes(1)
  })
})
