import { beforeAll, afterAll, beforeEach } from "vitest";
import { resetDatabase, closeDatabase } from "./db";

beforeAll(async () => {
  // 测试开始前的全局设置
  console.log("🧪 Starting test suite...");
});

beforeEach(async () => {
  // 每个测试前重置数据库
  await resetDatabase();
});

afterAll(async () => {
  // 测试结束后关闭数据库连接
  await closeDatabase();
  console.log("🧪 Test suite completed.");
});
