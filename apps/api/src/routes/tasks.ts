import { Hono } from "hono";
import { db } from "../db";
import { tasks } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "../lib/auth";

const app = new Hono()
  .get("/", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.query("projectId");
    if (!projectId) return c.json({ error: "Missing projectId" }, 400);

    const data = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(asc(tasks.position));

    return c.json({ data });
  })
  .post("/", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const { title, projectId, workspaceId, status } = await c.req.json();
    if (!title || !projectId || !workspaceId) return c.json({ error: "Missing fields" }, 400);

    // Get max position
    // For simplicity, we just put it at 0 or query existing count.
    // Let's assume frontend or subsequent logic handles reordering, or we default to 0.

    const [newTask] = await db
      .insert(tasks)
      .values({
        id: crypto.randomUUID(),
        title,
        projectId,
        organizationId: workspaceId,
        status: status || "TODO",
        position: 0, 
        assigneeId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return c.json({ data: newTask });
  })
  .patch("/:taskId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const taskId = c.req.param("taskId");
    const updates = await c.req.json();

    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    return c.json({ data: updatedTask });
  });

export default app;
