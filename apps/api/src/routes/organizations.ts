import { Hono } from "hono";
import { db } from "../db";
import { organization, member, projects, tasks, projectMembers } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "../lib/auth";
import { requireOrgOwner } from "../lib/permissions";

const app = new Hono()
  /**
   * 删除工作区
   * 仅 owner 可操作
   * 级联删除所有关联数据（成员、项目、任务）
   */
  .delete("/:orgId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const orgId = c.req.param("orgId");
    if (!orgId) return c.json({ error: "Missing orgId" }, 400);

    // 权限检查：仅 owner 可删除工作区
    await requireOrgOwner(session.user.id, orgId);

    // 获取工作区信息（用于确认存在）
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, orgId))
      .limit(1);

    if (!org) {
      return c.json({ error: "Organization not found" }, 404);
    }

    // 检查用户是否只有一个工作区（不允许删除最后一个工作区）
    const userOrgs = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(member)
      .where(eq(member.userId, session.user.id));

    if (userOrgs[0]?.count <= 1) {
      return c.json({ error: "Cannot delete your only workspace" }, 400);
    }

    // 删除工作区（级联删除会自动处理关联数据）
    // 由于 schema 中配置了 onDelete: 'cascade'，以下数据会自动删除：
    // - member（组织成员）
    // - projects（项目）-> projectMembers（项目成员）、tasks（任务）
    await db.delete(organization).where(eq(organization.id, orgId));

    return c.json({ success: true, message: "Organization deleted successfully" });
  })

  /**
   * 获取工作区统计信息（用于删除确认弹窗）
   * 仅 owner 可查看
   */
  .get("/:orgId/stats", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const orgId = c.req.param("orgId");
    if (!orgId) return c.json({ error: "Missing orgId" }, 400);

    // 权限检查：仅 owner 可查看（因为这是删除前的确认信息）
    await requireOrgOwner(session.user.id, orgId);

    // 获取工作区信息
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, orgId))
      .limit(1);

    if (!org) {
      return c.json({ error: "Organization not found" }, 404);
    }

    // 统计成员数
    const [memberCount] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(member)
      .where(eq(member.organizationId, orgId));

    // 统计项目数
    const [projectCount] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(projects)
      .where(eq(projects.organizationId, orgId));

    // 统计任务数
    const [taskCount] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(tasks)
      .where(eq(tasks.organizationId, orgId));

    return c.json({
      data: {
        organization: {
          id: org.id,
          name: org.name,
        },
        stats: {
          members: memberCount?.count || 0,
          projects: projectCount?.count || 0,
          tasks: taskCount?.count || 0,
        },
      },
    });
  });

export default app;
