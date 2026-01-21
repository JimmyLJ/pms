import { Hono } from "hono";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const app = new Hono();

const UPLOAD_DIR = join(process.cwd(), "uploads");

// Ensure upload directory exists
try {
  await mkdir(UPLOAD_DIR, { recursive: true });
} catch (e) {
  // Ignore if exists
}

app.post("/", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file uploaded" }, 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // Simple extension check
  const name = file.name;
  const ext = name.split(".").pop();
  const fileName = `${randomUUID()}.${ext}`;
  const filePath = join(UPLOAD_DIR, fileName);

  await writeFile(filePath, buffer);

  // Construct URL - assuming API is served at localhost:3000
  // and we mount static files at /uploads
  const url = `http://localhost:3000/uploads/${fileName}`;

  return c.json({ url });
});

export default app;
