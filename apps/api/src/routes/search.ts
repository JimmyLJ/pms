import { Hono } from "hono";
import { db } from "../db";
import { projects, tasks, projectMembers } from "../db/schema";
import { ilike, eq, desc, and, inArray } from "drizzle-orm";
import { auth } from "../lib/auth";
import { requireOrgRole, isOrgAdmin } from "../lib/permissions";

const app = new Hono().get("/search", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const workspaceId = c.req.query("workspaceId");
  const q = c.req.query("q");

  if (!workspaceId) return c.json({ error: "Missing workspaceId" }, 400);
  if (!q || q.trim().length === 0) {
    return c.json({ projects: [], tasks: [] });
  }

  // 权限检查：需要是组织成员
  await requireOrgRole(session.user.id, workspaceId, "member");

  const userId = session.user.id;
  const searchTerm = `%${q}%`;

  // 检查用户是否是 admin+，决定是否需要过滤数据
  const isAdmin = await isOrgAdmin(userId, workspaceId);

  // 如果不是 admin，获取用户参与的项目 ID 列表
  let userProjectIds: string[] = [];
  if (!isAdmin) {
    const userProjects = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .innerJoin(projects, eq(projectMembers.projectId, projects.id))
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projects.organizationId, workspaceId)
        )
      );
    userProjectIds = userProjects.map(p => p.projectId);

    // 用户没有参与任何项目，返回空结果
    if (userProjectIds.length === 0) {
      return c.json({ projects: [], tasks: [] });
    }
  }

  // 搜索项目
  const projectConditions = isAdmin
    ? [eq(projects.organizationId, workspaceId), ilike(projects.name, searchTerm)]
    : [eq(projects.organizationId, workspaceId), ilike(projects.name, searchTerm), inArray(projects.id, userProjectIds)];

  const projectResults = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .where(and(...projectConditions))
    .orderBy(desc(projects.updatedAt))
    .limit(5);

  // 搜索任务
  const taskConditions = isAdmin
    ? [eq(tasks.organizationId, workspaceId), ilike(tasks.title, searchTerm)]
    : [eq(tasks.organizationId, workspaceId), ilike(tasks.title, searchTerm), inArray(tasks.projectId, userProjectIds)];

  const taskResults = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      projectId: tasks.projectId,
    })
    .from(tasks)
    .where(and(...taskConditions))
    .orderBy(desc(tasks.updatedAt))
    .limit(5);

  return c.json({
    projects: projectResults,
    tasks: taskResults,
  });
});

export default app;
