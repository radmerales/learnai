import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DeleteButton } from "./DeleteButton"

describe("DeleteButton", () => {
  it("exposes an accessible label and reports clicks once", () => {
    const onClick = vi.fn()
    render(<DeleteButton label="Delete block 2" title="Delete block" onClick={onClick} />)

    fireEvent.click(screen.getByRole("button", { name: "Delete block 2" }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
