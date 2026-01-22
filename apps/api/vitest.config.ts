import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.{ts,js}"],
    setupFiles: ["./src/test/setup.ts"],
    fileParallelism: false, // 串行运行测试文件
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
