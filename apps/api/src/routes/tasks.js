import { Hono } from "hono";
import { db } from "../db";
import { tasks, user, projectMembers, projects } from "../db/schema";
import { eq, asc, and, inArray } from "drizzle-orm";
import { auth } from "../lib/auth";
import { requireProjectAccess, isOrgAdmin } from "../lib/permissions";
/**
 * 获取任务所属的项目 ID
 */
async function getTaskProjectId(taskId) {
    const [task] = await db
        .select({ projectId: tasks.projectId })
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);
    return task?.projectId || null;
}
const app = new Hono()
    .get("/", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session)
        return c.json({ error: "Unauthorized" }, 401);
    const projectId = c.req.query("projectId");
    const assigneeId = c.req.query("assigneeId");
    const workspaceId = c.req.query("workspaceId");
    if (!projectId && !assigneeId) {
        return c.json({ error: "Missing filter parameters (projectId or assigneeId)" }, 400);
    }
    const conditions = [];
    // 如果按 projectId 过滤，检查项目权限
    if (projectId) {
        await requireProjectAccess(session.user.id, projectId, "view");
        conditions.push(eq(tasks.projectId, projectId));
    }
    // 如果按 assigneeId 过滤（通常用于"我的任务"视图）
    if (assigneeId) {
        conditions.push(eq(tasks.assigneeId, assigneeId));
        // 如果没有指定 projectId，需要过滤出用户有权限访问的项目
        if (!projectId && workspaceId) {
            const isAdmin = await isOrgAdmin(session.user.id, workspaceId);
            if (!isAdmin) {
                // 获取用户参与的项目 ID 列表
                const userProjects = await db
                    .select({ projectId: projectMembers.projectId })
                    .from(projectMembers)
                    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
                    .where(and(eq(projectMembers.userId, session.user.id), eq(projects.organizationId, workspaceId)));
                const userProjectIds = userProjects.map(p => p.projectId);
                if (userProjectIds.length === 0) {
                    return c.json({ data: [] });
                }
                conditions.push(inArray(tasks.projectId, userProjectIds));
            }
        }
    }
    if (workspaceId) {
        conditions.push(eq(tasks.organizationId, workspaceId));
    }
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
    if (!session)
        return c.json({ error: "Unauthorized" }, 401);
    const { title, description, projectId, workspaceId, status, type, priority, dueDate, assigneeId, } = await c.req.json();
    if (!title || !projectId || !workspaceId)
        return c.json({ error: "Missing fields" }, 400);
    // 权限检查：需要 project:view 权限（项目成员可以创建任务）
    await requireProjectAccess(session.user.id, projectId, "view");
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
    if (!session)
        return c.json({ error: "Unauthorized" }, 401);
    const taskId = c.req.param("taskId");
    // 获取任务所属项目
    const projectId = await getTaskProjectId(taskId);
    if (!projectId) {
        return c.json({ error: "Task not found" }, 404);
    }
    // 权限检查：需要 project:view 权限（项目成员可以编辑任务）
    await requireProjectAccess(session.user.id, projectId, "view");
    const updates = await c.req.json();
    // 防止修改不可变字段
    delete updates.id;
    delete updates.projectId;
    delete updates.organizationId;
    delete updates.createdAt;
    const [updatedTask] = await db
        .update(tasks)
        .set({
        ...updates,
        updatedAt: new Date(),
    })
        .where(eq(tasks.id, taskId))
        .returning();
    return c.json({ data: updatedTask });
})
    .delete("/:taskId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session)
        return c.json({ error: "Unauthorized" }, 401);
    const taskId = c.req.param("taskId");
    // 获取任务所属项目
    const projectId = await getTaskProjectId(taskId);
    if (!projectId) {
        return c.json({ error: "Task not found" }, 404);
    }
    // 权限检查：需要 project:edit 权限（只有 lead+ 能删除任务）
    await requireProjectAccess(session.user.id, projectId, "edit");
    await db.delete(tasks).where(eq(tasks.id, taskId));
    return c.json({ success: true });
});
export default app;
