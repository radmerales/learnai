import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { MindmapHeader } from "./MindmapHeader"

const maps = [
  { id: "m1", title: "Biology", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
  { id: "m2", title: "History", createdAt: "2026-01-02T00:00:00Z", updatedAt: "2026-01-02T00:00:00Z" },
]

function renderHeader(overrides: Partial<Parameters<typeof MindmapHeader>[0]> = {}) {
  const props = {
    title: "Biology",
    maps,
    currentMapId: "m1",
    saveStatus: "saved" as const,
    saveError: null,
    loading: false,
    onTitleChange: vi.fn(),
    onOpenMap: vi.fn(),
    onNewMap: vi.fn(),
    onDeleteMap: vi.fn(),
    onRetrySave: vi.fn(),
    ...overrides,
  }
  render(<MindmapHeader {...props} />)
  return props
}

describe("MindmapHeader", () => {
  it("shows the current title and map list", () => {
    renderHeader()

    expect(screen.getByLabelText("Map title")).toHaveValue("Biology")
    expect(screen.getByRole("option", { name: "History" })).toBeInTheDocument()
  })

  it("reports title edits and map switches", () => {
    const props = renderHeader()

    fireEvent.change(screen.getByLabelText("Map title"), { target: { value: "New name" } })
    fireEvent.change(screen.getByLabelText("Open mindmap"), { target: { value: "m2" } })

    expect(props.onTitleChange).toHaveBeenCalledWith("New name")
    expect(props.onOpenMap).toHaveBeenCalledWith("m2")
  })

  it("offers a retry action when saving failed", () => {
    const props = renderHeader({
      saveStatus: "error",
      saveError: "Network unavailable",
    })

    expect(screen.getByText("Save failed")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))

    expect(props.onRetrySave).toHaveBeenCalledTimes(1)
  })

  it("disables map actions while a map is loading", () => {
    renderHeader({ loading: true })

    expect(screen.getByRole("button", { name: "New map" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled()
  })
})
