import { db } from "./src/db";
import { projects, organization, user, session, member } from "./src/db/schema";
import { desc } from "drizzle-orm";

const projectNames = [
  "官网重构项目", "移动端APP开发", "数据分析平台", "用户管理系统", "支付系统升级",
  "客服系统优化", "库存管理系统", "订单处理平台", "营销活动系统", "报表系统开发",
  "搜索功能优化", "性能监控系统", "安全加固项目", "API接口重构", "数据库迁移",
  "容器化部署", "CI/CD流程优化", "日志分析系统", "消息队列升级", "缓存系统优化",
  "文档管理系统", "知识库建设", "培训平台开发", "招聘管理系统", "绩效考核系统",
  "财务管理模块", "预算控制系统", "报销审批流程", "合同管理系统", "供应商管理平台",
  "客户关系管理系统", "售后服务平台", "质量监控系统", "测试自动化平台", "代码审查工具",
  "监控告警系统", "负载均衡优化", "CDN加速配置", "灾备方案实施", "多语言支持开发",
  "无障碍访问优化", "SEO优化项目", "数据可视化大屏", "BI报表系统", "用户画像系统",
  "推荐算法优化", "风控系统开发", "反欺诈系统", "实名认证模块", "短信通知服务",
  "邮件推送服务", "消息推送系统", "站内信功能", "评论系统开发", "社区功能模块",
  "积分商城系统", "会员权益体系", "优惠券发放平台", "拼团秒杀活动", "直播带货系统",
  "短视频功能开发", "社交分享功能"
];

const statuses = ["planning", "active", "completed", "on_hold", "cancelled"] as const;
const priorities = ["high", "medium", "low"] as const;

async function seedProjects() {
  console.log("开始生成测试项目数据...");

  // 获取用户最近一次登录的 session，从中获取 activeOrganizationId
  const recentSessions = await db
    .select()
    .from(session)
    .orderBy(desc(session.createdAt))
    .limit(1);

  let orgId: string;
  let userId: string;

  if (recentSessions.length > 0 && recentSessions[0].activeOrganizationId) {
    // 使用用户当前工作区
    orgId = recentSessions[0].activeOrganizationId;
    userId = recentSessions[0].userId;
    console.log(`使用用户当前工作区: ${orgId}`);
  } else {
    // 降级：查询用户的 member 记录获取 organization
    const userMemberships = await db
      .select({
        orgId: member.organizationId,
        userId: member.userId,
      })
      .from(member)
      .limit(1);

    if (userMemberships.length === 0) {
      // 再降级：使用数据库中第一个 organization
      const orgs = await db.select().from(organization).limit(1);
      if (orgs.length === 0) {
        console.log("没有找到 organization，请先创建组织");
        process.exit(1);
      }
      orgId = orgs[0].id;
      const users = await db.select().from(user).limit(1);
      userId = users[0]?.id || "system";
      console.log(`使用数据库中第一个 organization: ${orgId}`);
    } else {
      orgId = userMemberships[0].orgId;
      userId = userMemberships[0].userId;
      console.log(`使用用户所属工作区: ${orgId}`);
    }
  }

  console.log(`用户 ID: ${userId}`);
  console.log(`生成 60 个项目...`);

  // 创建60个项目
  const projectData = Array.from({ length: 60 }, (_, i) => {
    const createdAt = new Date(Date.now() - i * 3600000); // 每小时创建一个
    return {
      id: crypto.randomUUID(),
      name: `${projectNames[i % projectNames.length]} ${Math.floor(i / projectNames.length) + 1}`,
      description: `这是第 ${i + 1} 个测试项目，用于测试滚动加载功能。`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      progress: Math.floor(Math.random() * 101),
      organizationId: orgId,
      leadId: userId,
      createdAt,
      updatedAt: createdAt,
    };
  });

  await db.insert(projects).values(projectData);

  console.log(`成功创建 ${projectData.length} 个项目！`);
  process.exit(0);
}

seedProjects().catch((err) => {
  console.error("生成数据失败:", err);
  process.exit(1);
});
