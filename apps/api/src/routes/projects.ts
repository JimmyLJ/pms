import { Hono } from "hono";
import { db } from "../db";
import { projects } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "../lib/auth";

const app = new Hono()
  .get("/", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const workspaceId = c.req.query("workspaceId");
    if (!workspaceId) return c.json({ error: "Missing workspaceId" }, 400);

    // TODO: Verify user is member of workspace

    const data = await db
      .select()
      .from(projects)
      .where(eq(projects.organizationId, workspaceId))
      .orderBy(desc(projects.createdAt));

    return c.json({ data });
  })
  .post("/", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const { name, workspaceId } = await c.req.json();
    if (!name || !workspaceId) return c.json({ error: "Missing fields" }, 400);

    const [newProject] = await db
      .insert(projects)
      .values({
        id: crypto.randomUUID(),
        name,
        organizationId: workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return c.json({ data: newProject });
  });

export default app;
