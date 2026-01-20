import { Hono } from "hono";
import { db } from "../db";
import { tasks, user } from "../db/schema";
import { eq, asc, and } from "drizzle-orm";
import { auth } from "../lib/auth";

const app = new Hono()
  .get("/", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.query("projectId");
    const assigneeId = c.req.query("assigneeId");
    const workspaceId = c.req.query("workspaceId");

    if (!projectId && !assigneeId) {
      return c.json({ error: "Missing filter parameters (projectId or assigneeId)" }, 400);
    }

    const conditions = [];
    if (projectId) conditions.push(eq(tasks.projectId, projectId));
    if (assigneeId) conditions.push(eq(tasks.assigneeId, assigneeId));
    if (workspaceId) conditions.push(eq(tasks.organizationId, workspaceId));

    const rows = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        type: tasks.type,
        priority: tasks.priority,
        position: tasks.position,
        projectId: tasks.projectId,
        organizationId: tasks.organizationId,
        assigneeId: tasks.assigneeId,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assigneeName: user.name,
        assigneeImage: user.image,
      })
      .from(tasks)
      .leftJoin(user, eq(tasks.assigneeId, user.id))
      .where(and(...conditions))
      .orderBy(asc(tasks.position));

    const data = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      type: row.type,
      priority: row.priority,
      position: row.position,
      projectId: row.projectId,
      organizationId: row.organizationId,
      assigneeId: row.assigneeId,
      dueDate: row.dueDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      assignee: row.assigneeId
        ? {
          id: row.assigneeId,
          name: row.assigneeName,
          image: row.assigneeImage,
        }
        : null,
    }));

    return c.json({ data });
  })
  .post("/", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const {
      title,
      description,
      projectId,
      workspaceId,
      status,
      type,
      priority,
      dueDate,
      assigneeId,
    } = await c.req.json();
    if (!title || !projectId || !workspaceId) return c.json({ error: "Missing fields" }, 400);

    // Get max position
    // For simplicity, we just put it at 0 or query existing count.
    // Let's assume frontend or subsequent logic handles reordering, or we default to 0.

    const [newTask] = await db
      .insert(tasks)
      .values({
        id: crypto.randomUUID(),
        title,
        description: description || null,
        projectId,
        organizationId: workspaceId,
        status: status || "TODO",
        type: type || undefined,
        priority: priority || undefined,
        position: 0,
        assigneeId: typeof assigneeId === "string" ? assigneeId : null,
        dueDate: dueDate ? new Date(dueDate) : null,
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
