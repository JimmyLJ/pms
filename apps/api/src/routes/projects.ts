import { Hono } from "hono";
import { db } from "../db";
import { projects, projectMembers, user } from "../db/schema";
import { eq, desc, lt, and, sql, inArray } from "drizzle-orm";
import { auth } from "../lib/auth";

const app = new Hono()
  .get("/:projectId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");
    if (!projectId) return c.json({ error: "Missing projectId" }, 400);

    // 获取项目信息
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    // 获取项目成员列表
    const members = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
      })
      .from(projectMembers)
      .innerJoin(user, eq(projectMembers.userId, user.id))
      .where(eq(projectMembers.projectId, projectId));

    return c.json({
      data: {
        ...project,
        members,
      },
    });
  })
  .get("/", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const workspaceId = c.req.query("workspaceId");
    if (!workspaceId) return c.json({ error: "Missing workspaceId" }, 400);

    const limit = parseInt(c.req.query("limit") || "30");
    const cursor = c.req.query("cursor");

    // 构建查询条件
    const conditions = [eq(projects.organizationId, workspaceId)];
    if (cursor) {
      // 使用 createdAt 作为游标，需要获取游标对应记录的 createdAt
      const [cursorProject] = await db
        .select({ createdAt: projects.createdAt })
        .from(projects)
        .where(eq(projects.id, cursor))
        .limit(1);
      if (cursorProject) {
        conditions.push(lt(projects.createdAt, cursorProject.createdAt));
      }
    }

    const data = await db
      .select()
      .from(projects)
      .where(and(...conditions))
      .orderBy(desc(projects.createdAt))
      .limit(limit);

    // 判断是否还有更多数据
    const [hasMoreData] = await db
      .select({ count: sql`count(*)` })
      .from(projects)
      .where(and(...conditions))
      .limit(1);

    const totalAfterCursor = Number(hasMoreData?.count || 0);
    const hasMore = data.length === limit && totalAfterCursor > 0;

    return c.json({ data, hasMore, nextCursor: hasMore ? data[data.length - 1].id : null });
  })
  .post("/", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const { name, description, status, priority, startDate, endDate, leadId, memberIds, workspaceId } = await c.req.json();
    if (!name || !workspaceId) return c.json({ error: "Missing fields" }, 400);

    const [newProject] = await db
      .insert(projects)
      .values({
        id: crypto.randomUUID(),
        name,
        description: description || null,
        status: status || "planning",
        priority: priority || "medium",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        leadId: leadId || null,
        progress: 0,
        organizationId: workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 创建项目成员关联（自动加入创建者）
    const requestedMemberIds = Array.isArray(memberIds) ? memberIds : [];
    const memberIdSet = new Set<string>(requestedMemberIds.filter(Boolean));
    memberIdSet.add(session.user.id);
    const finalMemberIds = Array.from(memberIdSet);
    if (finalMemberIds.length > 0) {
      await db.insert(projectMembers).values(
        finalMemberIds.map((userId: string) => ({
          id: crypto.randomUUID(),
          projectId: newProject.id,
          userId,
          createdAt: new Date(),
        }))
      );
    }

    return c.json({ data: newProject });
  })
  .patch("/:projectId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");
    const updates = await c.req.json();

    // Remove immutable fields or validate as needed
    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.organizationId; // Usually shouldn't change organization

    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const [updatedProject] = await db
      .update(projects)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return c.json({ data: updatedProject });
  });

export default app;
