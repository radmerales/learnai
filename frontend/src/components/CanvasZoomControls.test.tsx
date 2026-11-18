import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { CanvasZoomControls } from "./CanvasZoomControls"

describe("CanvasZoomControls", () => {
  it("shows the rounded zoom percentage", () => {
    render(
      <CanvasZoomControls
        zoom={1.256}
        canZoomIn
        canZoomOut
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
      />,
    )

    expect(screen.getByText("126%")).toBeInTheDocument()
  })

  it("calls the zoom handlers", () => {
    const onZoomIn = vi.fn()
    const onZoomOut = vi.fn()
    render(
      <CanvasZoomControls
        zoom={1}
        canZoomIn
        canZoomOut
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }))
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }))

    expect(onZoomIn).toHaveBeenCalledOnce()
    expect(onZoomOut).toHaveBeenCalledOnce()
  })

  it("disables buttons at the zoom limits", () => {
    render(
      <CanvasZoomControls
        zoom={0.25}
        canZoomIn={false}
        canZoomOut={false}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled()
  })
})
