import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Testing Library does not share React roots between tests, so unmount the
// previous tree after every test to avoid duplicate elements in the DOM.
afterEach(() => {
  cleanup()
})
