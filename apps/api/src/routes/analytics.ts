import { Hono } from "hono";
import { db } from "../db";
import { tasks, projects, user, projectMembers } from "../db/schema";
import { eq, sql, desc, and, lt, ne, inArray } from "drizzle-orm";
import { auth } from "../lib/auth";
import { requireOrgRole, isOrgAdmin } from "../lib/permissions";

const app = new Hono()
  .get("/dashboard", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const workspaceId = c.req.query("workspaceId");
    if (!workspaceId) return c.json({ error: "Missing workspaceId" }, 400);

    // 权限检查：需要是组织成员
    await requireOrgRole(session.user.id, workspaceId, "member");

    const userId = session.user.id;
    const now = new Date();

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
    }

    // 构建项目过滤条件
    const projectConditions = isAdmin
      ? [eq(projects.organizationId, workspaceId)]
      : userProjectIds.length > 0
        ? [eq(projects.organizationId, workspaceId), inArray(projects.id, userProjectIds)]
        : null;

    // 构建任务过滤条件
    const taskConditions = isAdmin
      ? [eq(tasks.organizationId, workspaceId)]
      : userProjectIds.length > 0
        ? [eq(tasks.organizationId, workspaceId), inArray(tasks.projectId, userProjectIds)]
        : null;

    // 如果用户没有参与任何项目，返回空数据
    if (!isAdmin && userProjectIds.length === 0) {
      return c.json({
        data: {
          counts: {
            totalProjects: 0,
            completedProjects: 0,
            globalOverdue: 0,
            myTasks: 0,
            taskStatusCounts: []
          },
          lists: {
            recentProjects: [],
            recentActivity: [],
            myStats: {
              inProgress: [],
              overdue: [],
              recent: []
            }
          }
        },
      });
    }

    // --- 全局统计 ---
    // 1. 项目总数
    const [totalProjectsResult] = await db
      .select({ count: sql<number>`cast(count(${projects.id}) as int)` })
      .from(projects)
      .where(and(...projectConditions!));

    // 2. 已完成项目数
    const [completedProjectsResult] = await db
      .select({ count: sql<number>`cast(count(${projects.id}) as int)` })
      .from(projects)
      .where(and(...projectConditions!, eq(projects.status, "completed")));

    // 3. 任务状态分布
    const taskCounts = await db
      .select({
        status: tasks.status,
        count: sql<number>`cast(count(${tasks.id}) as int)`,
      })
      .from(tasks)
      .where(and(...taskConditions!))
      .groupBy(tasks.status);

    // 4. 全局逾期任务数
    const [globalOverdueResult] = await db
      .select({ count: sql<number>`cast(count(${tasks.id}) as int)` })
      .from(tasks)
      .where(
        and(
          ...taskConditions!,
          lt(tasks.dueDate, now),
          ne(tasks.status, "done"),
          ne(tasks.status, "completed")
        )
      );

    // --- 个人维度统计 ---
    // 5. 我的任务总数
    const [myTasksCountResult] = await db
      .select({ count: sql<number>`cast(count(${tasks.id}) as int)` })
      .from(tasks)
      .where(and(...taskConditions!, eq(tasks.assigneeId, userId)));

    // --- 列表数据 ---
    // 6. 最近创建的任务（带用户信息）
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
      .where(and(...taskConditions!))
      .orderBy(desc(tasks.createdAt))
      .limit(5);

    // 7. 最近创建的项目
    const recentProjects = await db
      .select()
      .from(projects)
      .where(and(...projectConditions!))
      .orderBy(desc(projects.createdAt))
      .limit(3);

    // 8. 我的任务列表 (Active/In Progress)
    const myActiveTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          ...taskConditions!,
          eq(tasks.assigneeId, userId),
          eq(tasks.status, "IN_PROGRESS")
        )
      )
      .orderBy(desc(tasks.updatedAt))
      .limit(5);

    // 9. 我的逾期任务列表
    const myOverdueTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          ...taskConditions!,
          eq(tasks.assigneeId, userId),
          lt(tasks.dueDate, now),
          ne(tasks.status, "DONE"),
          ne(tasks.status, "completed")
        )
      )
      .orderBy(desc(tasks.dueDate))
      .limit(5);

    // 10. 我的所有任务预览
    const myRecentTasks = await db
      .select()
      .from(tasks)
      .where(and(...taskConditions!, eq(tasks.assigneeId, userId)))
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
          recentProjects,
          recentActivity: recentActivityTasks,
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
