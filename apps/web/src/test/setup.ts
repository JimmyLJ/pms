import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll } from "vitest";
import { server } from "./mocks/server";

// 启动 MSW mock server
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

// 每个测试后重置 handlers 和清理 DOM
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// 测试完成后关闭 server
afterAll(() => {
  server.close();
});
