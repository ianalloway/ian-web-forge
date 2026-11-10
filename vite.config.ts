import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Reuse workers across test files instead of spawning one per file. The
    // suite is pure, deterministic unit tests with no shared global state, so
    // isolation buys nothing and costs ~130ms of worker startup per file.
    isolate: false,
  },
});
