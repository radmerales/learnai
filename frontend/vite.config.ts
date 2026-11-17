import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Relative asset URLs keep the production build portable: the same `dist/`
// works at the root of a custom domain and under /<repository>/ on GitHub Pages.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
