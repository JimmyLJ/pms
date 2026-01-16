import { db } from "./src/db";
import { tasks, projects, session } from "./src/db/schema";
import { eq, desc } from "drizzle-orm";

const PROJECT_ID = "333805c2-4002-452f-bbcf-d7a22c4a857f";

const testTasks = [
  { title: "完成用户登录功能", type: "FEATURE", priority: "HIGH", status: "IN_PROGRESS", dueDate: "2026-01-20" },
  { title: "修复导航栏抖动问题", type: "BUG", priority: "HIGH", status: "TODO", dueDate: "2026-01-17" },
  { title: "优化页面加载性能", type: "IMPROVEMENT", priority: "MEDIUM", status: "TODO", dueDate: "2026-01-22" },
  { title: "添加数据导出功能", type: "FEATURE", priority: "MEDIUM", status: "TODO", dueDate: "2026-01-25" },
  { title: "修复表单验证错误", type: "BUG", priority: "HIGH", status: "IN_PROGRESS", dueDate: "2026-01-16" },
  { title: "编写技术文档", type: "TASK", priority: "LOW", status: "DONE", dueDate: "2026-01-15" },
  { title: "数据库迁移脚本", type: "TASK", priority: "MEDIUM", status: "TODO", dueDate: "2026-01-18" },
  { title: "旧代码重构", type: "IMPROVEMENT", priority: "LOW", status: "TODO", dueDate: "2026-01-23" },
  { title: "API接口测试覆盖", type: "TASK", priority: "MEDIUM", status: "IN_PROGRESS", dueDate: "2026-01-19" },
  { title: "安全漏洞扫描", type: "TASK", priority: "HIGH", status: "TODO", dueDate: "2026-01-10" },
];

async function seedTasks() {
  console.log("开始创建测试任务...");

  // 1. 获取最近登录用户的 ID
  const recentSessions = await db
    .select()
    .from(session)
    .orderBy(desc(session.createdAt))
    .limit(1);

  if (recentSessions.length === 0) {
    console.error("没有找到登录会话");
    process.exit(1);
  }

  const userId = recentSessions[0].userId;
  console.log(`当前登录用户: ${userId}`);

  // 2. 获取项目的 organizationId
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, PROJECT_ID))
    .limit(1);

  if (!project) {
    console.error(`未找到项目: ${PROJECT_ID}`);
    process.exit(1);
  }

  const organizationId = project.organizationId;
  console.log(`项目组织ID: ${organizationId}`);

  // 3. 插入测试任务
  const taskData = testTasks.map((task) => ({
    id: crypto.randomUUID(),
    title: task.title,
    description: null,
    status: task.status,
    type: task.type,
    priority: task.priority,
    position: 0,
    projectId: PROJECT_ID,
    organizationId: organizationId!,
    assigneeId: userId,
    dueDate: new Date(task.dueDate),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.insert(tasks).values(taskData);

  console.log(`成功创建 ${taskData.length} 个测试任务！`);
  process.exit(0);
}

seedTasks().catch((err) => {
  console.error("创建测试任务失败:", err);
  process.exit(1);
});
