import { Hono } from "hono";
import { db } from "../db";
import { user, member } from "../db/schema";
import { ilike, eq, and, notInArray, or } from "drizzle-orm";
import { auth } from "../lib/auth";
import { requireOrgRole } from "../lib/permissions";
const app = new Hono()
    /**
     * 搜索用户（排除已是指定工作区成员的用户）
     */
    .get("/search", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session)
        return c.json({ error: "Unauthorized" }, 401);
    const q = c.req.query("q");
    const workspaceId = c.req.query("workspaceId");
    if (!workspaceId)
        return c.json({ error: "Missing workspaceId" }, 400);
    if (!q || q.trim().length === 0) {
        return c.json({ data: [] });
    }
    // 权限检查：需要是组织管理员才能添加成员
    await requireOrgRole(session.user.id, workspaceId, "admin");
    const searchTerm = `%${q.trim()}%`;
    // 获取已是成员的用户 ID
    const existingMembers = await db
        .select({ userId: member.userId })
        .from(member)
        .where(eq(member.organizationId, workspaceId));
    const existingUserIds = existingMembers.map((m) => m.userId);
    // 搜索用户（按邮箱或姓名），排除已是成员的
    const conditions = [
        or(ilike(user.name, searchTerm), ilike(user.email, searchTerm)),
    ];
    // 如果有已存在的成员，排除他们
    if (existingUserIds.length > 0) {
        conditions.push(notInArray(user.id, existingUserIds));
    }
    const users = await db
        .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
    })
        .from(user)
        .where(and(...conditions))
        .limit(10);
    return c.json({ data: users });
});
export default app;
