import { db } from "./src/db";
import { tasks, projects, organization, user, member } from "./src/db/schema";
import { eq, and } from "drizzle-orm";

const TARGET_EMAIL = "liji420@qq.com";
const TARGET_ORG_SLUG = "org2";

// 3 个要添加的任务模板
const taskTemplates = [
  {
    title: "需求分析与文档整理",
    type: "TASK",
    priority: "HIGH",
    status: "TODO",
    daysFromNow: 7,
  },
  {
    title: "功能开发与单元测试",
    type: "FEATURE",
    priority: "MEDIUM",
    status: "TODO",
    daysFromNow: 14,
  },
  {
    title: "代码审查与上线部署",
    type: "IMPROVEMENT",
    priority: "LOW",
    status: "TODO",
    daysFromNow: 21,
  },
];

async function addTasksForOrg2() {
  console.log(`开始为用户 ${TARGET_EMAIL} 的 ${TARGET_ORG_SLUG} 工作区添加任务...`);

  // 1. 查找目标用户
  const [targetUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, TARGET_EMAIL))
    .limit(1);

  if (!targetUser) {
    console.error(`未找到用户: ${TARGET_EMAIL}`);
    process.exit(1);
  }
  console.log(`找到用户: ${targetUser.name} (${targetUser.id})`);

  // 2. 查找 org2 工作区
  const [targetOrg] = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, TARGET_ORG_SLUG))
    .limit(1);

  if (!targetOrg) {
    console.error(`未找到 slug 为 "${TARGET_ORG_SLUG}" 的工作区`);
    process.exit(1);
  }
  console.log(`找到工作区: ${targetOrg.name} (${targetOrg.id})`);

  // 3. 验证用户是该组织成员
  const [membership] = await db
    .select()
    .from(member)
    .where(
      and(
        eq(member.userId, targetUser.id),
        eq(member.organizationId, targetOrg.id)
      )
    )
    .limit(1);

  if (!membership) {
    console.error(`用户 ${TARGET_EMAIL} 不是工作区 ${TARGET_ORG_SLUG} 的成员`);
    process.exit(1);
  }
  console.log(`确认用户是该工作区成员，角色: ${membership.role}`);

  // 4. 获取该工作区所有成员的 userId
  const orgMembers = await db
    .select({ userId: member.userId })
    .from(member)
    .where(eq(member.organizationId, targetOrg.id));

  if (orgMembers.length === 0) {
    console.error(`工作区 ${TARGET_ORG_SLUG} 中没有成员`);
    process.exit(1);
  }
  const memberUserIds = orgMembers.map((m) => m.userId);
  console.log(`找到 ${memberUserIds.length} 个团队成员，任务将随机分配给他们`);

  // 随机选取一个成员
  const randomMember = () => memberUserIds[Math.floor(Math.random() * memberUserIds.length)];

  // 5. 获取该工作区的所有项目
  const orgProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.organizationId, targetOrg.id));

  if (orgProjects.length === 0) {
    console.error(`工作区 ${TARGET_ORG_SLUG} 中没有项目`);
    process.exit(1);
  }
  console.log(`找到 ${orgProjects.length} 个项目，开始为每个项目添加 3 个任务...\n`);

  // 6. 为每个项目添加 3 个任务
  let totalAdded = 0;
  for (const project of orgProjects) {
    const now = new Date();

    const taskData = taskTemplates.map((template, index) => {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + template.daysFromNow);

      return {
        id: crypto.randomUUID(),
        title: template.title,
        description: `针对项目「${project.name}」的${template.title}工作`,
        status: template.status,
        type: template.type,
        priority: template.priority,
        position: index,
        projectId: project.id,
        organizationId: targetOrg.id,
        assigneeId: randomMember(),
        dueDate,
        createdAt: now,
        updatedAt: now,
      };
    });

    await db.insert(tasks).values(taskData);
    totalAdded += taskData.length;
    console.log(`  ✓ 项目「${project.name}」- 已添加 ${taskData.length} 个任务`);
  }

  console.log(`\n✅ 完成！共为 ${orgProjects.length} 个项目添加了 ${totalAdded} 个任务。`);
  process.exit(0);
}

addTasksForOrg2().catch((err) => {
  console.error("添加任务失败:", err);
  process.exit(1);
});
