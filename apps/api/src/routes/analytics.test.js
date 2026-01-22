import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestApp } from "../test/app";
import {
    createTestUser,
    createTestOrganization,
    createTestMember,
    createTestProject,
    createTestTask,
    generateId,
} from "../test/helpers";
import { testDb } from "../test/db";
import { projectMembers } from "../db/schema";

// Mock auth module
let mockSession = null;
vi.mock("../lib/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn(async () => mockSession),
        },
    },
}));

const app = createTestApp();

function setMockSession(user, org) {
    mockSession = user ? { user, session: { activeOrganizationId: org?.id } } : null;
}

function apiRequest(path) {
    return app.request(path);
}

describe("Analytics API", () => {
    beforeEach(() => {
        mockSession = null;
    });

    describe("GET /api/analytics/dashboard", () => {
        it("应该返回仪表盘数据", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");
            const project = await createTestProject(org.id, { status: "active" });
            await createTestTask(project.id, org.id, { status: "TODO" });
            await createTestTask(project.id, org.id, { status: "IN_PROGRESS" });
            await createTestTask(project.id, org.id, { status: "DONE" });

            setMockSession(user, org);
            const res = await apiRequest(`/api/analytics/dashboard?workspaceId=${org.id}`);

            expect(res.status).toBe(200);
            const json = await res.json();

            // 验证数据结构
            expect(json.data.counts).toBeDefined();
            expect(json.data.counts.totalProjects).toBe(1);
            expect(json.data.counts.taskStatusCounts).toBeInstanceOf(Array);
            expect(json.data.lists).toBeDefined();
            expect(json.data.lists.recentProjects).toBeInstanceOf(Array);
        });

        it("缺少 workspaceId 应该返回 400", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");

            setMockSession(user, org);
            const res = await apiRequest(`/api/analytics/dashboard`);

            expect(res.status).toBe(400);
        });

        it("未登录应该返回 401", async () => {
            setMockSession(null);
            const res = await apiRequest("/api/analytics/dashboard?workspaceId=123");

            expect(res.status).toBe(401);
        });

        it("非组织成员应该返回 403", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            // user 不是 org 的成员
            const anotherOrg = await createTestOrganization();
            await createTestMember(anotherOrg.id, user.id, "member");

            setMockSession(user, anotherOrg);
            const res = await apiRequest(`/api/analytics/dashboard?workspaceId=${org.id}`);

            expect(res.status).toBe(403);
        });

        it("admin 应该看到所有项目数据", async () => {
            const admin = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, admin.id, "admin");

            // 创建多个项目
            const project1 = await createTestProject(org.id, { name: "项目 1" });
            const project2 = await createTestProject(org.id, { name: "项目 2" });
            await createTestTask(project1.id, org.id, { status: "TODO" });
            await createTestTask(project2.id, org.id, { status: "IN_PROGRESS" });

            setMockSession(admin, org);
            const res = await apiRequest(`/api/analytics/dashboard?workspaceId=${org.id}`);

            expect(res.status).toBe(200);
            const json = await res.json();

            // admin 应该看到所有项目
            expect(json.data.counts.totalProjects).toBe(2);
        });

        it("普通成员只能看到自己参与的项目数据", async () => {
            const admin = await createTestUser();
            const member = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, admin.id, "admin");
            await createTestMember(org.id, member.id, "member");

            // 创建两个项目
            const project1 = await createTestProject(org.id, { name: "项目 1" });
            const project2 = await createTestProject(org.id, { name: "项目 2" });

            // member 只参与 project1
            await testDb.insert(projectMembers).values({
                id: generateId(),
                projectId: project1.id,
                userId: member.id,
                createdAt: new Date(),
            });

            await createTestTask(project1.id, org.id, { status: "TODO" });
            await createTestTask(project2.id, org.id, { status: "TODO" });

            setMockSession(member, org);
            const res = await apiRequest(`/api/analytics/dashboard?workspaceId=${org.id}`);

            expect(res.status).toBe(200);
            const json = await res.json();

            // member 只能看到参与的项目
            expect(json.data.counts.totalProjects).toBe(1);
        });

        it("没有参与任何项目的成员应该返回空数据", async () => {
            const admin = await createTestUser();
            const member = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, admin.id, "admin");
            await createTestMember(org.id, member.id, "member");

            // 创建项目但不添加 member
            const project = await createTestProject(org.id);
            await createTestTask(project.id, org.id, { status: "TODO" });

            setMockSession(member, org);
            const res = await apiRequest(`/api/analytics/dashboard?workspaceId=${org.id}`);

            expect(res.status).toBe(200);
            const json = await res.json();

            // 应该返回空数据
            expect(json.data.counts.totalProjects).toBe(0);
            expect(json.data.counts.myTasks).toBe(0);
            expect(json.data.lists.recentProjects).toHaveLength(0);
        });

        it("应该正确统计任务状态分布", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");
            const project = await createTestProject(org.id);

            // 创建不同状态的任务
            await createTestTask(project.id, org.id, { status: "TODO" });
            await createTestTask(project.id, org.id, { status: "TODO" });
            await createTestTask(project.id, org.id, { status: "IN_PROGRESS" });
            await createTestTask(project.id, org.id, { status: "DONE" });
            await createTestTask(project.id, org.id, { status: "DONE" });
            await createTestTask(project.id, org.id, { status: "DONE" });

            setMockSession(user, org);
            const res = await apiRequest(`/api/analytics/dashboard?workspaceId=${org.id}`);

            expect(res.status).toBe(200);
            const json = await res.json();

            const statusCounts = json.data.counts.taskStatusCounts;
            const todoCount = statusCounts.find(s => s.status === "TODO")?.count || 0;
            const inProgressCount = statusCounts.find(s => s.status === "IN_PROGRESS")?.count || 0;
            const doneCount = statusCounts.find(s => s.status === "DONE")?.count || 0;

            expect(todoCount).toBe(2);
            expect(inProgressCount).toBe(1);
            expect(doneCount).toBe(3);
        });

        it("应该正确统计我的任务数", async () => {
            const user = await createTestUser();
            const anotherUser = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");
            await createTestMember(org.id, anotherUser.id, "member");
            const project = await createTestProject(org.id);

            // 创建分配给不同用户的任务
            await createTestTask(project.id, org.id, { assigneeId: user.id });
            await createTestTask(project.id, org.id, { assigneeId: user.id });
            await createTestTask(project.id, org.id, { assigneeId: anotherUser.id });
            await createTestTask(project.id, org.id, { assigneeId: null });

            setMockSession(user, org);
            const res = await apiRequest(`/api/analytics/dashboard?workspaceId=${org.id}`);

            expect(res.status).toBe(200);
            const json = await res.json();

            // user 只有 2 个任务
            expect(json.data.counts.myTasks).toBe(2);
        });
    });
});
