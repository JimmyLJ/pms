import { Hono } from "hono";
import { db } from "../db";
import { tasks, projects, user } from "../db/schema";
import { eq, sql, desc, and, lt, ne, or } from "drizzle-orm";
import { auth } from "../lib/auth";

const app = new Hono()
  .get("/dashboard", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const workspaceId = c.req.query("workspaceId");
    if (!workspaceId) return c.json({ error: "Missing workspaceId" }, 400);

    const userId = session.user.id;
    const now = new Date();

    // --- 全局统计 ---
    // 1. 项目总数
    const [totalProjectsResult] = await db
      .select({ count: sql<number>`cast(count(${projects.id}) as int)` })
      .from(projects)
      .where(eq(projects.organizationId, workspaceId));

    // 2. 已完成项目数
    const [completedProjectsResult] = await db
      .select({ count: sql<number>`cast(count(${projects.id}) as int)` })
      .from(projects)
      .where(and(eq(projects.organizationId, workspaceId), eq(projects.status, "completed")));

    // 3. 任务状态分布 (保留现有)
    const taskCounts = await db
      .select({
        status: tasks.status,
        count: sql<number>`cast(count(${tasks.id}) as int)`,
      })
      .from(tasks)
      .where(eq(tasks.organizationId, workspaceId))
      .groupBy(tasks.status);

    // 4. 全局逾期任务数 (未完成且截止日期小于当前时间)
    const [globalOverdueResult] = await db
      .select({ count: sql<number>`cast(count(${tasks.id}) as int)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, workspaceId),
          lt(tasks.dueDate, now),
          ne(tasks.status, "done"), // 假设 'done' 是完成状态，根据之前的代码可能是 'DONE' 或 'completed'，需统一。这里假设用 tasks 表里的 status
          ne(tasks.status, "completed") // 防御性编程，排除常见完成状态
        )
      );

    // --- 个人维度统计 ---
    // 5. 我的任务总数
    const [myTasksCountResult] = await db
      .select({ count: sql<number>`cast(count(${tasks.id}) as int)` })
      .from(tasks)
      .where(and(eq(tasks.organizationId, workspaceId), eq(tasks.assigneeId, userId)));

    // --- 列表数据 ---
    // 6. 最近创建的任务 (全局 - Limit 5)
    const recentTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        type: tasks.type,
        createdAt: tasks.createdAt,
        assigneeName: tasks.assigneeId, // 临时 hack，理想情况应该 join user 表，但为了保持响应结构一致先这样，或者下面做 join
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id)) // 确保任务属于该该工作区的项目
      .where(eq(tasks.organizationId, workspaceId))
      .orderBy(desc(tasks.createdAt))
      .limit(5);

    // 补全用户信息 (为了最近活动卡片) - 重新查询带 User 信息
    const recentActivityTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        type: tasks.type,
        createdAt: tasks.createdAt,
        assignee: {
          name: user.name,
          image: user.image
        }
      })
      .from(tasks)
      .leftJoin(user, eq(tasks.assigneeId, user.id))
      .where(eq(tasks.organizationId, workspaceId))
      .orderBy(desc(tasks.createdAt))
      .limit(5);

    // 7. 最近创建的项目 (全局 - Limit 5)
    const recentProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.organizationId, workspaceId))
      .orderBy(desc(projects.createdAt))
      .limit(3);

    // 8. 我的任务列表 (Active/In Progress - Limit 5 - 用于右侧栏)
    const myActiveTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, workspaceId),
          eq(tasks.assigneeId, userId),
          eq(tasks.status, "IN_PROGRESS") // 假设数据库存的是 IN_PROGRESS
        )
      )
      .orderBy(desc(tasks.updatedAt))
      .limit(5);

    // 9. 我的逾期任务列表 (Limit 5 - 用于右侧栏)
    const myOverdueTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, workspaceId),
          eq(tasks.assigneeId, userId),
          lt(tasks.dueDate, now),
          ne(tasks.status, "DONE"),
          ne(tasks.status, "completed")
        )
      )
      .orderBy(desc(tasks.dueDate))
      .limit(5);

    // 10. 我的所有任务预览 (Limit 5)
    const myRecentTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.organizationId, workspaceId), eq(tasks.assigneeId, userId)))
      .orderBy(desc(tasks.createdAt))
      .limit(5);

    return c.json({
      data: {
        counts: {
          totalProjects: totalProjectsResult?.count || 0,
          completedProjects: completedProjectsResult?.count || 0,
          globalOverdue: globalOverdueResult?.count || 0,
          myTasks: myTasksCountResult?.count || 0,
          taskStatusCounts: taskCounts
        },
        lists: {
          recentProjects, // 全局最近项目
          recentActivity: recentActivityTasks, // 全局最近活动
          myStats: {
            inProgress: myActiveTasks,
            overdue: myOverdueTasks,
            recent: myRecentTasks
          }
        }
      },
    });
  });

export default app;
