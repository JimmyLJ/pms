import { db } from "./src/db";
import { user, member, organization } from "./src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// 工作区2 的 8 个模拟成员（不同于工作区1的成员）
const MOCK_MEMBERS = [
  { name: "吴晨曦", email: "wu.chenxi@teamdemo.com", role: "admin" },
  { name: "郑浩然", email: "zheng.haoran@teamdemo.com", role: "member" },
  { name: "黄雅琴", email: "huang.yaqin@teamdemo.com", role: "member" },
  { name: "林志远", email: "lin.zhiyuan@teamdemo.com", role: "member" },
  { name: "徐梦洁", email: "xu.mengjie@teamdemo.com", role: "member" },
  { name: "谢鹏飞", email: "xie.pengfei@teamdemo.com", role: "member" },
  { name: "冯雅芳", email: "feng.yafang@teamdemo.com", role: "member" },
  { name: "蒋天宇", email: "jiang.tianyu@teamdemo.com", role: "member" },
];

async function seedDemoMembers() {
  const TARGET_EMAIL = "liji420@qq.com";
  const TARGET_WORKSPACE = "工作区2";

  console.log(`\n🔍 查找用户: ${TARGET_EMAIL}`);

  const [targetUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, TARGET_EMAIL));

  if (!targetUser) {
    console.error(`❌ 用户 ${TARGET_EMAIL} 不存在`);
    process.exit(1);
  }
  console.log(`✅ 找到用户: ${targetUser.name}`);

  const userMemberships = await db
    .select({ orgId: member.organizationId })
    .from(member)
    .where(eq(member.userId, targetUser.id));

  if (!userMemberships.length) {
    console.error(`❌ 用户没有工作区`);
    process.exit(1);
  }

  const orgIds = userMemberships.map((m) => m.orgId);
  const orgs = await db.select().from(organization);
  const org = orgs.find((o) => orgIds.includes(o.id) && o.name === TARGET_WORKSPACE);

  if (!org) {
    console.error(`❌ 没有找到名称为"${TARGET_WORKSPACE}"的工作区`);
    console.log("当前工作区列表:", orgs.filter(o => orgIds.includes(o.id)).map(o => o.name));
    process.exit(1);
  }
  console.log(`✅ 找到工作区: ${org.name}\n`);

  let created = 0;
  for (const mock of MOCK_MEMBERS) {
    const userId = crypto.randomUUID();

    await db.insert(user).values({
      id: userId,
      name: mock.name,
      email: mock.email,
      emailVerified: true,
      image: `https://api.dicebear.com/9.x/avataaars/svg?seed=${userId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();

    const [existingUser] = await db.select().from(user).where(eq(user.email, mock.email));
    if (!existingUser) continue;

    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: org.id,
      userId: existingUser.id,
      role: mock.role,
      createdAt: new Date(),
    }).onConflictDoNothing();

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
