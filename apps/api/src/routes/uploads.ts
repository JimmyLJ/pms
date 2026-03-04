import { Hono } from "hono";
import { writeFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const app = new Hono();

const UPLOAD_DIR = join(process.cwd(), "uploads");

// 确保上传目录存在（同步执行，服务启动时保证目录就绪）
try {
  mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  // 如果已存在则忽略
}

app.post("/", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file uploaded" }, 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // 简单的扩展名检查
  const name = file.name;
  const ext = name.split(".").pop();
  const fileName = `${randomUUID()}.${ext}`;
  const filePath = join(UPLOAD_DIR, fileName);

  await writeFile(filePath, buffer);

  // 构建 URL，使用 BETTER_AUTH_URL 环境变量作为基础地址
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3100";
  const url = `${baseUrl}/uploads/${fileName}`;

  return c.json({ url });
});

export default app;
