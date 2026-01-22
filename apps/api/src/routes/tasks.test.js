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

function apiRequest(path, options = {}) {
    const headers = new Headers(options.headers);
    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    return app.request(path, { ...options, headers });
}

describe("Tasks API", () => {
    beforeEach(() => {
        mockSession = null;
    });

    describe("GET /api/tasks", () => {
        it("应该返回项目的任务列表", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");
            const project = await createTestProject(org.id);

            await createTestTask(project.id, org.id, { title: "任务 1" });
            await createTestTask(project.id, org.id, { title: "任务 2" });

            setMockSession(user, org);
            const res = await apiRequest(`/api/tasks?projectId=${project.id}`);

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.data).toHaveLength(2);
        });

        it("缺少过滤参数应该返回 400", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");

            setMockSession(user, org);
            const res = await apiRequest(`/api/tasks`);

            expect(res.status).toBe(400);
            const json = await res.json();
            expect(json.error).toContain("Missing");
        });

        it("未登录应该返回 401", async () => {
            setMockSession(null);
            const res = await apiRequest("/api/tasks?projectId=123");

            expect(res.status).toBe(401);
        });

        it("无项目权限应该返回 403", async () => {
            const admin = await createTestUser();
            const normalUser = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, admin.id, "admin");
            await createTestMember(org.id, normalUser.id, "member");
            const project = await createTestProject(org.id);

            // normalUser 不是项目成员
            setMockSession(normalUser, org);
            const res = await apiRequest(`/api/tasks?projectId=${project.id}`);

            expect(res.status).toBe(403);
        });
    });

    describe("POST /api/tasks", () => {
        it("应该成功创建任务", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");
            const project = await createTestProject(org.id);

            setMockSession(user, org);
            const res = await apiRequest(`/api/tasks`, {
                method: "POST",
                body: JSON.stringify({
                    title: "新任务",
                    projectId: project.id,
                    workspaceId: org.id,
                    status: "TODO",
                }),
            });

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.data.title).toBe("新任务");
            expect(json.data.status).toBe("TODO");
        });

        it("缺少必填字段应该返回 400", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");

            setMockSession(user, org);
            const res = await apiRequest(`/api/tasks`, {
                method: "POST",
                body: JSON.stringify({
                    title: "新任务",
                    // 缺少 projectId 和 workspaceId
                }),
            });

            expect(res.status).toBe(400);
        });

        it("项目成员可以创建任务", async () => {
            const lead = await createTestUser();
            const member = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, lead.id, "member");
            await createTestMember(org.id, member.id, "member");
            const project = await createTestProject(org.id, { leadId: lead.id });

            // 添加 member 为项目成员
            await testDb.insert(projectMembers).values({
                id: generateId(),
                projectId: project.id,
                userId: member.id,
                createdAt: new Date(),
            });

            setMockSession(member, org);
            const res = await apiRequest(`/api/tasks`, {
                method: "POST",
                body: JSON.stringify({
                    title: "成员创建的任务",
                    projectId: project.id,
                    workspaceId: org.id,
                }),
            });

            expect(res.status).toBe(200);
        });
    });

    describe("PATCH /api/tasks/:taskId", () => {
        it("应该成功更新任务", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");
            const project = await createTestProject(org.id);
            const task = await createTestTask(project.id, org.id);

            setMockSession(user, org);
            const res = await apiRequest(`/api/tasks/${task.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    title: "更新后的标题",
                    status: "IN_PROGRESS",
                }),
            });

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.data.title).toBe("更新后的标题");
            expect(json.data.status).toBe("IN_PROGRESS");
        });

        it("任务不存在应该返回 404", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");

            setMockSession(user, org);
            const res = await apiRequest(`/api/tasks/non-existent-id`, {
                method: "PATCH",
                body: JSON.stringify({ title: "测试" }),
            });

            expect(res.status).toBe(404);
        });

        it("不能修改不可变字段", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");
            const project = await createTestProject(org.id);
            const task = await createTestTask(project.id, org.id);

            setMockSession(user, org);
            const res = await apiRequest(`/api/tasks/${task.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    id: "hacked-id",
                    projectId: "hacked-project",
                    title: "正常更新",
                }),
            });

            expect(res.status).toBe(200);
            const json = await res.json();
            // id 和 projectId 应该保持不变
            expect(json.data.id).toBe(task.id);
            expect(json.data.projectId).toBe(project.id);
        });
    });

    describe("DELETE /api/tasks/:taskId", () => {
        it("项目 lead 可以删除任务", async () => {
            const lead = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, lead.id, "member");
            const project = await createTestProject(org.id, { leadId: lead.id });
            const task = await createTestTask(project.id, org.id);

            setMockSession(lead, org);
            const res = await apiRequest(`/api/tasks/${task.id}`, {
                method: "DELETE",
            });

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.success).toBe(true);
        });

        it("组织 admin 可以删除任务", async () => {
            const admin = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, admin.id, "admin");
            const project = await createTestProject(org.id);
            const task = await createTestTask(project.id, org.id);

            setMockSession(admin, org);
            const res = await apiRequest(`/api/tasks/${task.id}`, {
                method: "DELETE",
            });

            expect(res.status).toBe(200);
        });

        it("普通项目成员不能删除任务", async () => {
            const lead = await createTestUser();
            const member = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, lead.id, "member");
            await createTestMember(org.id, member.id, "member");
            const project = await createTestProject(org.id, { leadId: lead.id });

            // 添加 member 为项目成员
            await testDb.insert(projectMembers).values({
                id: generateId(),
                projectId: project.id,
                userId: member.id,
                createdAt: new Date(),
            });

            const task = await createTestTask(project.id, org.id);

            setMockSession(member, org);
            const res = await apiRequest(`/api/tasks/${task.id}`, {
                method: "DELETE",
            });

            expect(res.status).toBe(403);
        });

        it("任务不存在应该返回 404", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");

            setMockSession(user, org);
            const res = await apiRequest(`/api/tasks/non-existent-id`, {
                method: "DELETE",
            });

            expect(res.status).toBe(404);
        });
    });
});
