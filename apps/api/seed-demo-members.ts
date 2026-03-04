import { db } from "./src/db";
import { user, member, organization } from "./src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// 8 个模拟成员（中文名 + 职位风格的邮箱）
const MOCK_MEMBERS = [
  { name: "陈晓明", email: "chen.xiaoming@teamdemo.com", role: "admin" },
  { name: "王青青", email: "wang.qingqing@teamdemo.com", role: "member" },
  { name: "刘宇航", email: "liu.yuhang@teamdemo.com", role: "member" },
  { name: "张雨欣", email: "zhang.yuxin@teamdemo.com", role: "member" },
  { name: "李建国", email: "li.jianguo@teamdemo.com", role: "member" },
  { name: "赵思远", email: "zhao.siyuan@teamdemo.com", role: "member" },
  { name: "孙婷婷", email: "sun.tingting@teamdemo.com", role: "member" },
  { name: "周文博", email: "zhou.wenbo@teamdemo.com", role: "member" },
];

async function seedDemoMembers() {
  const TARGET_EMAIL = "liji420@qq.com";

  console.log(`\n🔍 查找用户: ${TARGET_EMAIL}`);

  // 1. 找到目标用户
  const [targetUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, TARGET_EMAIL));

  if (!targetUser) {
    console.error(`❌ 用户 ${TARGET_EMAIL} 不存在，请先在线上注册该账号。`);
    process.exit(1);
  }

  console.log(`✅ 找到用户: ${targetUser.name} (${targetUser.id})`);

  // 2. 找到该用户的工作区1
  const userMemberships = await db
    .select({ orgId: member.organizationId })
    .from(member)
    .where(eq(member.userId, targetUser.id));

  if (!userMemberships.length) {
    console.error(`❌ 用户没有工作区，请先在线上创建工作区。`);
    process.exit(1);
  }

  // 从所有工作区里找名称是"工作区1"的
  const orgIds = userMemberships.map((m) => m.orgId);
  const orgs = await db.select().from(organization);
  const targetOrg = orgs.find(
    (o) => orgIds.includes(o.id) && o.name === "工作区1"
  );

  if (!targetOrg) {
    console.error(`❌ 没有找到名称为"工作区1"的工作区。`);
    console.log("当前工作区列表:", orgs.filter(o => orgIds.includes(o.id)).map(o => o.name));
    process.exit(1);
  }

  const org = targetOrg;

  console.log(`✅ 找到工作区: ${org.name} (${org.id})\n`);

  // 3. 创建 8 个模拟成员
  let created = 0;
  for (const mock of MOCK_MEMBERS) {
    const userId = crypto.randomUUID();

    // 插入 user（如果邮箱已存在则跳过）
    await db
      .insert(user)
      .values({
        id: userId,
        name: mock.name,
        email: mock.email,
        emailVerified: true,
        image: `https://api.dicebear.com/9.x/avataaars/svg?seed=${userId}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    // 查找实际插入的 userId（防止邮箱已存在情况）
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, mock.email));

    if (!existingUser) continue;

    // 插入 member（如果已是成员则跳过）
    await db
      .insert(member)
      .values({
        id: crypto.randomUUID(),
        organizationId: org.id,
        userId: existingUser.id,
        role: mock.role,
        createdAt: new Date(),
      })
      .onConflictDoNothing();

    console.log(`  ✅ 已添加: ${mock.name} (${mock.role})`);
    created++;
  }

  console.log(`\n🎉 成功为工作区【${org.name}】添加 ${created} 个模拟成员！`);
  process.exit(0);
}

seedDemoMembers().catch((err) => {
  console.error("❌ 执行出错:", err);
  process.exit(1);
});
