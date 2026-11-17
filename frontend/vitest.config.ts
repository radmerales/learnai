/**
 * Vitest is the test runner; jsdom gives tests a fake browser DOM so React
 * components can be rendered without opening a real browser.
 *
 * Python comparison: pytest + a lightweight in-memory "browser".
 */
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
})
