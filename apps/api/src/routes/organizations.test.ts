import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import organizationsRouter from "./organizations";
import {
  createTestUser,
  createTestOrganization,
  createTestMember,
  createTestProject,
  createTestTask,
  generateId,
} from "../test/helpers";
import { testDb } from "../test/db";
import { member, organization, projects, tasks } from "../db/schema";
import { eq, and } from "drizzle-orm";

// Mock auth module
let mockSession: any = null;
vi.mock("../lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => mockSession),
    },
  },
}));

function createTestApp() {
  const app = new Hono();
  app.route("/api/organizations", organizationsRouter);
  return app;
}

const app = createTestApp();

function setMockSession(user: any, org?: any) {
  mockSession = user
    ? { user, session: { activeOrganizationId: org?.id } }
    : null;
}

function apiRequest(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return app.request(path, { ...options, headers });
}

describe("Organizations API", () => {
  beforeEach(() => {
    mockSession = null;
  });

  // ==================== DELETE /:orgId ====================

  describe("DELETE /api/organizations/:orgId", () => {
    it("owner 应该能删除工作区", async () => {
      const user = await createTestUser();
      const org1 = await createTestOrganization({ name: "工作区 1" });
      const org2 = await createTestOrganization({ name: "工作区 2" });
      await createTestMember(org1.id, user.id, "owner");
      await createTestMember(org2.id, user.id, "owner");

      setMockSession(user, org1);
      const res = await apiRequest(`/api/organizations/${org1.id}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // 验证工作区已被删除
      const [deletedOrg] = await testDb
        .select()
        .from(organization)
        .where(eq(organization.id, org1.id));
      expect(deletedOrg).toBeUndefined();
    });

    it("未登录应该返回 401", async () => {
      setMockSession(null);
      const res = await apiRequest(`/api/organizations/some-org-id`, {
        method: "DELETE",
      });

      expect(res.status).toBe(401);
    });

    it("admin 不能删除工作区（仅 owner 可以）", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, user.id, "admin");

      setMockSession(user, org);
      const res = await apiRequest(`/api/organizations/${org.id}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(403);
    });

    it("普通成员不能删除工作区", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, user.id, "member");

      setMockSession(user, org);
      const res = await apiRequest(`/api/organizations/${org.id}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(403);
    });

    it("不能删除唯一的工作区", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, user.id, "owner");

      setMockSession(user, org);
      const res = await apiRequest(`/api/organizations/${org.id}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("only workspace");
    });

    it("不存在的工作区应该返回 404", async () => {
      const user = await createTestUser();
      // 用户需要是某个 org 的 owner，但尝试删除一个不存在的 org
      // requireOrgOwner 会先抛 403，因为用户不是该 org 的成员
      const org = await createTestOrganization();
      await createTestMember(org.id, user.id, "owner");

      setMockSession(user, org);
      const res = await apiRequest(`/api/organizations/non-existent-id`, {
        method: "DELETE",
      });

      // requireOrgOwner 先于 org 存在检查，所以返回 403
      expect(res.status).toBe(403);
    });

    it("删除工作区应该级联删除项目和任务", async () => {
      const user = await createTestUser();
      const org1 = await createTestOrganization({ name: "待删除" });
      const org2 = await createTestOrganization({ name: "保留" });
      await createTestMember(org1.id, user.id, "owner");
      await createTestMember(org2.id, user.id, "owner");

      // 在 org1 下创建项目和任务
      const project = await createTestProject(org1.id);
      await createTestTask(project.id, org1.id, { title: "任务 1" });
      await createTestTask(project.id, org1.id, { title: "任务 2" });

      setMockSession(user, org1);
      const res = await apiRequest(`/api/organizations/${org1.id}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(200);

      // 验证项目已被级联删除
      const remainingProjects = await testDb
        .select()
        .from(projects)
        .where(eq(projects.organizationId, org1.id));
      expect(remainingProjects).toHaveLength(0);

      // 验证任务已被级联删除
      const remainingTasks = await testDb
        .select()
        .from(tasks)
        .where(eq(tasks.organizationId, org1.id));
      expect(remainingTasks).toHaveLength(0);
    });
  });

  // ==================== GET /:orgId/stats ====================

  describe("GET /api/organizations/:orgId/stats", () => {
    it("owner 应该能获取工作区统计", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization({ name: "我的工作区" });
      await createTestMember(org.id, user.id, "owner");

      // 创建一些数据
      const project = await createTestProject(org.id);
      await createTestTask(project.id, org.id);
      await createTestTask(project.id, org.id);

      // 添加另一个成员
      const user2 = await createTestUser();
      await createTestMember(org.id, user2.id, "member");

      setMockSession(user, org);
      const res = await apiRequest(`/api/organizations/${org.id}/stats`);

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.organization.id).toBe(org.id);
      expect(json.data.organization.name).toBe("我的工作区");
      expect(json.data.stats.members).toBe(2); // owner + member
      expect(json.data.stats.projects).toBe(1);
      expect(json.data.stats.tasks).toBe(2);
    });

    it("未登录应该返回 401", async () => {
      setMockSession(null);
      const res = await apiRequest(`/api/organizations/some-id/stats`);

      expect(res.status).toBe(401);
    });

    it("admin 不能查看统计（仅 owner 可以）", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, user.id, "admin");

      setMockSession(user, org);
      const res = await apiRequest(`/api/organizations/${org.id}/stats`);

      expect(res.status).toBe(403);
    });

    it("普通成员不能查看统计", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, user.id, "member");

      setMockSession(user, org);
      const res = await apiRequest(`/api/organizations/${org.id}/stats`);

      expect(res.status).toBe(403);
    });

    it("空工作区的统计应该全为 0", async () => {
      const user = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, user.id, "owner");

      setMockSession(user, org);
      const res = await apiRequest(`/api/organizations/${org.id}/stats`);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.stats.projects).toBe(0);
      expect(json.data.stats.tasks).toBe(0);
      expect(json.data.stats.members).toBe(1); // owner 自己
    });
  });

  // ==================== POST /:orgId/members ====================

  describe("POST /api/organizations/:orgId/members", () => {
    it("admin 应该能添加成员", async () => {
      const admin = await createTestUser();
      const newUser = await createTestUser({ name: "新成员" });
      const org = await createTestOrganization();
      await createTestMember(org.id, admin.id, "admin");

      setMockSession(admin, org);
      const res = await apiRequest(`/api/organizations/${org.id}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: newUser.id }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.userId).toBe(newUser.id);
      expect(json.data.role).toBe("member"); // 默认角色
      expect(json.data.user.name).toBe("新成员");
    });

    it("owner 应该能添加成员", async () => {
      const owner = await createTestUser();
      const newUser = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, owner.id, "owner");

      setMockSession(owner, org);
      const res = await apiRequest(`/api/organizations/${org.id}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: newUser.id, role: "admin" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.role).toBe("admin");
    });

    it("普通成员不能添加其他成员", async () => {
      const memberUser = await createTestUser();
      const newUser = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, memberUser.id, "member");

      setMockSession(memberUser, org);
      const res = await apiRequest(`/api/organizations/${org.id}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: newUser.id }),
      });

      expect(res.status).toBe(403);
    });

    it("未登录应该返回 401", async () => {
      setMockSession(null);
      const res = await apiRequest(`/api/organizations/some-id/members`, {
        method: "POST",
        body: JSON.stringify({ userId: "user-1" }),
      });

      expect(res.status).toBe(401);
    });

    it("不能添加已存在的成员", async () => {
      const admin = await createTestUser();
      const existingUser = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, admin.id, "admin");
      await createTestMember(org.id, existingUser.id, "member");

      setMockSession(admin, org);
      const res = await apiRequest(`/api/organizations/${org.id}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: existingUser.id }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("already a member");
    });

    it("添加不存在的用户应该返回 404", async () => {
      const admin = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, admin.id, "admin");

      setMockSession(admin, org);
      const res = await apiRequest(`/api/organizations/${org.id}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: "non-existent-user-id" }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain("User not found");
    });

    it("缺少 userId 应该返回 400", async () => {
      const admin = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, admin.id, "admin");

      setMockSession(admin, org);
      const res = await apiRequest(`/api/organizations/${org.id}/members`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    it("无效的 role 应该返回 400", async () => {
      const admin = await createTestUser();
      const newUser = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, admin.id, "admin");

      setMockSession(admin, org);
      const res = await apiRequest(`/api/organizations/${org.id}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: newUser.id, role: "owner" }),
      });

      expect(res.status).toBe(400);
    });
  });

  // ==================== DELETE /:orgId/members/:memberId ====================

  describe("DELETE /api/organizations/:orgId/members/:memberId", () => {
    it("admin 应该能移除普通成员", async () => {
      const admin = await createTestUser();
      const memberUser = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, admin.id, "admin");
      const memberRecord = await createTestMember(org.id, memberUser.id, "member");

      setMockSession(admin, org);
      const res = await apiRequest(
        `/api/organizations/${org.id}/members/${memberRecord.id}`,
        { method: "DELETE" }
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // 验证成员已被删除
      const [deletedMember] = await testDb
        .select()
        .from(member)
        .where(eq(member.id, memberRecord.id));
      expect(deletedMember).toBeUndefined();
    });

    it("未登录应该返回 401", async () => {
      setMockSession(null);
      const res = await apiRequest(
        `/api/organizations/org-id/members/member-id`,
        { method: "DELETE" }
      );

      expect(res.status).toBe(401);
    });

    it("普通成员不能移除其他成员", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, user1.id, "member");
      const member2 = await createTestMember(org.id, user2.id, "member");

      setMockSession(user1, org);
      const res = await apiRequest(
        `/api/organizations/${org.id}/members/${member2.id}`,
        { method: "DELETE" }
      );

      expect(res.status).toBe(403);
    });

    it("不能移除 owner", async () => {
      const admin = await createTestUser();
      const owner = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, admin.id, "admin");
      const ownerMember = await createTestMember(org.id, owner.id, "owner");

      setMockSession(admin, org);
      const res = await apiRequest(
        `/api/organizations/${org.id}/members/${ownerMember.id}`,
        { method: "DELETE" }
      );

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("owner");
    });

    it("不能移除自己", async () => {
      const admin = await createTestUser();
      const org = await createTestOrganization();
      const adminMember = await createTestMember(org.id, admin.id, "admin");

      setMockSession(admin, org);
      const res = await apiRequest(
        `/api/organizations/${org.id}/members/${adminMember.id}`,
        { method: "DELETE" }
      );

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("yourself");
    });

    it("成员不存在应该返回 404", async () => {
      const admin = await createTestUser();
      const org = await createTestOrganization();
      await createTestMember(org.id, admin.id, "admin");

      setMockSession(admin, org);
      const res = await apiRequest(
        `/api/organizations/${org.id}/members/non-existent-member`,
        { method: "DELETE" }
      );

      expect(res.status).toBe(404);
    });
  });
});
