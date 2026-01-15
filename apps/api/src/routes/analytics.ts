import { Hono } from "hono";
import { db } from "../db";
import { tasks, projects } from "../db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { auth } from "../lib/auth";

const app = new Hono()
  .get("/dashboard", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const workspaceId = c.req.query("workspaceId");
    if (!workspaceId) return c.json({ error: "Missing workspaceId" }, 400);

    // 1. 任务状态统计
    const taskCounts = await db
      .select({
        status: tasks.status,
        count: sql<number>`cast(count(${tasks.id}) as int)`,
      })
      .from(tasks)
      .where(eq(tasks.organizationId, workspaceId))
      .groupBy(tasks.status);

    // 2. 最近创建的任务 (Limit 5)
    const recentTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.organizationId, workspaceId))
      .orderBy(desc(tasks.createdAt))
      .limit(5);

    // 3. 最近创建的项目 (Limit 5)
    const recentProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.organizationId, workspaceId))
      .orderBy(desc(projects.createdAt))
      .limit(3);

    return c.json({ data: { taskCounts, recentTasks, recentProjects } });
  });

export default app;
