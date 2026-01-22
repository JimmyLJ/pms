import { Hono } from "hono";
import { db } from "../db";
import { user, projects, projectMembers, member } from "../db/schema";
import { eq, desc, lt, and, sql, inArray, notInArray } from "drizzle-orm";
import { auth } from "../lib/auth";
import { requireOrgRole, requireProjectAccess, isOrgAdmin } from "../lib/permissions";

const app = new Hono()
  .get("/:projectId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");
    if (!projectId) return c.json({ error: "Missing projectId" }, 400);

    // 权限检查：需要 project:view 权限
    await requireProjectAccess(session.user.id, projectId, "view");

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
  /**
   * 获取可选的项目成员（即同组织下但未加入该项目的成员）
   */
  .get("/:projectId/candidates", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");

    // 权限检查：需要 project:edit 权限
    await requireProjectAccess(session.user.id, projectId, "edit");

    // 1. 获取项目所属组织ID
    const [project] = await db
      .select({ organizationId: projects.organizationId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) return c.json({ error: "Project not found" }, 404);

    // 2. 获取已在项目中的成员ID列表
    const currentMembers = await db
      .select({ userId: projectMembers.userId })
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));

    const currentMemberIds = currentMembers.map(m => m.userId);

    // 3. 查询同组织下排除已加入项目的成员
    const conditions = [
      eq(member.organizationId, project.organizationId),
    ];

    if (currentMemberIds.length > 0) {
      conditions.push(notInArray(member.userId, currentMemberIds));
    }

    const candidates = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(and(...conditions));

    return c.json({ data: candidates });
  })
  /**
   * 添加成员到项目
   */
  .post("/:projectId/members", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");
    const { userId } = await c.req.json();

    if (!userId) return c.json({ error: "Missing userId" }, 400);

    // 权限检查：需要 project:edit 权限
    await requireProjectAccess(session.user.id, projectId, "edit");

    // 检查用户是否已经是项目成员
    const [existing] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
      .limit(1);

    if (existing) {
      return c.json({ error: "User is already a member" }, 400);
    }

    // 添加成员
    await db.insert(projectMembers).values({
      id: crypto.randomUUID(),
      projectId,
      userId,
      createdAt: new Date(),
    });

    return c.json({ success: true });
  })
  /**
   * 移除项目成员
   */
  .delete("/:projectId/members/:userId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");
    const userId = c.req.param("userId");

    // 权限检查：需要 project:edit 权限
    await requireProjectAccess(session.user.id, projectId, "edit");

    // 检查是否在移除自己
    if (userId === session.user.id) {
      return c.json({ error: "Cannot remove yourself from project" }, 400);
    }

    // 检查是否是项目负责人
    const [project] = await db
      .select({ leadId: projects.leadId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (project?.leadId === userId) {
      return c.json({ error: "Cannot remove project lead" }, 400);
    }

    // 移除成员
    await db.delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));

    return c.json({ success: true });
  })
  .get("/", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const workspaceId = c.req.query("workspaceId");
    if (!workspaceId) return c.json({ error: "Missing workspaceId" }, 400);

    // 权限检查：需要是组织成员
    await requireOrgRole(session.user.id, workspaceId, "member");

    const limit = parseInt(c.req.query("limit") || "30");
    const cursor = c.req.query("cursor");

    // 检查用户是否是 admin+，决定是否需要过滤项目
    const isAdmin = await isOrgAdmin(session.user.id, workspaceId);

    // 构建查询条件
    const conditions = [eq(projects.organizationId, workspaceId)];

    // 如果不是 admin，只能看到自己参与的项目
    if (!isAdmin) {
      // 获取用户参与的项目 ID 列表
      const userProjects = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.userId, session.user.id));

      const userProjectIds = userProjects.map(p => p.projectId);

      if (userProjectIds.length === 0) {
        // 用户没有参与任何项目，返回空列表
        return c.json({ data: [], hasMore: false, nextCursor: null });
      }

      conditions.push(inArray(projects.id, userProjectIds));
    }

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

    // 权限检查：需要 org:admin+ 才能创建项目
    await requireOrgRole(session.user.id, workspaceId, "admin");

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

    // 权限检查：需要 project:edit 权限（org:admin+ 或 project:lead）
    await requireProjectAccess(session.user.id, projectId, "edit");

    const updates = await c.req.json();

    // 移除不可变字段或按需验证
    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.organizationId; // 通常不应更改组织

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
  })
  .delete("/:projectId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");

    // 权限检查：需要 project:admin 权限（org:admin+ 或 project:lead）
    await requireProjectAccess(session.user.id, projectId, "admin");

    // 删除项目（关联的 projectMembers 和 tasks 会通过 onDelete: 'cascade' 自动删除）
    await db.delete(projects).where(eq(projects.id, projectId));

    return c.json({ success: true });
  });

export default app;
