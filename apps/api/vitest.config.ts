import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "drizzle/**",
        "src/test/**",
        "**/*.config.ts",
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
