import { db } from "./src/db/index.js";
import { user, organization, member, projects, projectMembers, tasks } from "./src/db/schema.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

async function seed() {
  const targetEmail = "liji420@qq.com";
  
  console.log(`Starting to seed fake data for ${targetEmail}...`);
  
  const existingUser = await db.select().from(user).where(eq(user.email, targetEmail));
  
  if (!existingUser || existingUser.length === 0) {
    console.error(`User with email ${targetEmail} not found!`);
    process.exit(1);
  }
  
  const targetUser = existingUser[0];
  const now = new Date();

  // Create 2 Organizations
  const orgsData = [
    {
      id: crypto.randomUUID(),
      name: "星战计划研发部",
      slug: "star-wars-dev",
      createdAt: now,
      metadata: JSON.stringify({ description: "专注于星战计划核心产品的研发" })
    },
    {
      id: crypto.randomUUID(),
      name: "黑客帝国运维组",
      slug: "matrix-ops",
      createdAt: now,
      metadata: JSON.stringify({ description: "负责基础架构体系的稳定运行" })
    }
  ];
  
  await db.insert(organization).values(orgsData);
  console.log(`✅ Created 2 Organizations: ${orgsData.map(o => o.name).join(', ')}`);

  // Assign user as owner of these organizations
  const membersData = orgsData.map(org => ({
    id: crypto.randomUUID(),
    organizationId: org.id,
    userId: targetUser.id,
    role: 'owner',
    createdAt: now
  }));
  await db.insert(member).values(membersData);
  console.log(`✅ Assigned user ${targetEmail} as owner of the organizations`);

  // Projects data definition
  const pData = [
    // Org 1 Projects
    { name: "死星核心动力系统", description: "关于高能动力炉的架构升级", bg: "star-wars-dev" },
    { name: "光剑研发V2.0", description: "增加光剑颜色的自定义功能", bg: "star-wars-dev" },
    { name: "克隆人军团招募追踪", description: "招募进度数据仪表盘", bg: "star-wars-dev" },
    // Org 2 Projects
    { name: "锡安基地安防监控", description: "监控矩阵特工的活动", bg: "matrix-ops" },
    { name: "矩阵代码解密加速器", description: "提升红药丸用户的解密效率", bg: "matrix-ops" },
    { name: "虚拟训练程序扩展", description: "新增武术和驾驶模块", bg: "matrix-ops" }
  ];

  const statuses = ["TODO", "IN_PROGRESS", "DONE"];
  const types = ["FEATURE", "BUG", "TASK", "IMPROVEMENT"];
  const priorities = ["LOW", "MEDIUM", "HIGH"];

  for (const p of pData) {
    const org = orgsData.find(o => o.slug === p.bg)!;
    
    // Create Project
    const projectId = crypto.randomUUID();
    const startDate = new Date(now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000);
    const endDate = new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    await db.insert(projects).values({
      id: projectId,
      name: p.name,
      description: p.description,
      status: Math.random() > 0.5 ? "planning" : "active",
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      startDate,
      endDate,
      leadId: targetUser.id,
      progress: Math.floor(Math.random() * 100),
      organizationId: org.id,
      createdAt: now,
      updatedAt: now
    });

    // Add User to Project Members
    await db.insert(projectMembers).values({
      id: crypto.randomUUID(),
      projectId: projectId,
      userId: targetUser.id,
      createdAt: now
    });
    
    // Create 3 Tasks for the Project
    const tasksData = Array.from({ length: 3 }).map((_, i) => ({
      id: crypto.randomUUID(),
      title: `${p.name} - 任务项目 0${i + 1}`,
      description: `这里是属于【${p.name}】的具体要求细节，需要按照标准规范进行实现。`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      type: types[Math.floor(Math.random() * types.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      position: i * 1000,
      projectId: projectId,
      organizationId: org.id,
      assigneeId: targetUser.id,
      dueDate: new Date(now.getTime() + Math.random() * 20 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now
    }));

    await db.insert(tasks).values(tasksData);
  }

  console.log(`✅ Created 6 Projects (3 per Organization)`);
  console.log(`✅ Created 18 Tasks (3 per Project) assigned to ${targetEmail}`);
  
  console.log("🎉 Seed data created successfully.");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
