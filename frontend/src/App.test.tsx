import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import App from "./App"

vi.mock("./components/MindmapPage", () => ({
  MindmapPage: () => <div>Mindmap page</div>,
}))

describe("App", () => {
  it("renders the mindmap page", () => {
    render(<App />)

    expect(screen.getByText("Mindmap page")).toBeInTheDocument()
  })
})
