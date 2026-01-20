import { Hono } from "hono";
import { db } from "../db";
import { projects, tasks } from "../db/schema";
import { ilike, or, eq, desc, limit } from "drizzle-orm";
import { auth } from "../lib/auth";

const app = new Hono().get("/search", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const workspaceId = c.req.query("workspaceId");
  const q = c.req.query("q");

  if (!workspaceId) return c.json({ error: "Missing workspaceId" }, 400);
  if (!q || q.trim().length === 0) {
    return c.json({ projects: [], tasks: [] });
  }

  const searchTerm = `%${q}%`;

  // 搜索项目
  const projectResults = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .where(
      and(
        eq(projects.organizationId, workspaceId),
        ilike(projects.name, searchTerm)
      )
    )
    .orderBy(desc(projects.updatedAt))
    .limit(5);

  // 搜索任务
  const taskResults = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      projectId: tasks.projectId,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.organizationId, workspaceId),
        ilike(tasks.title, searchTerm)
      )
    )
    .orderBy(desc(tasks.updatedAt))
    .limit(5);

  return c.json({
    projects: projectResults,
    tasks: taskResults,
  });
});

function and(
  ...conditions: Array<any>
) {
  // Drizzle 的 and 需要多个参数
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

export default app;
