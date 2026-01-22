import { Hono } from "hono";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const app = new Hono();

const UPLOAD_DIR = join(process.cwd(), "uploads");

// 确保上传目录存在
try {
  await mkdir(UPLOAD_DIR, { recursive: true });
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

  // 构建 URL - 假设 API 运行在 localhost:3000
  // 并且我们将静态文件挂载在 /uploads
  const url = `http://localhost:3000/uploads/${fileName}`;

  return c.json({ url });
});

export default app;
