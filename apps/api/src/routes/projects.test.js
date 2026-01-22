import { describe, it, expect } from "vitest";
import { testDb } from "../test/db";
import { createTestUser, createTestOrganization, createTestMember, createTestProject, createTestTask, } from "../test/helpers";
import { projects, projectMembers, tasks } from "../db/schema";
import { eq } from "drizzle-orm";
describe("Projects", () => {
    describe("数据层测试", () => {
        it("应该能创建项目", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "owner");
            const project = await createTestProject(org.id, {
                name: "测试项目",
                description: "这是一个测试项目",
                status: "active",
            });
            expect(project).toBeDefined();
            expect(project.name).toBe("测试项目");
            expect(project.organizationId).toBe(org.id);
            // 验证数据库中的数据
            const [dbProject] = await testDb
                .select()
                .from(projects)
                .where(eq(projects.id, project.id));
            expect(dbProject).toBeDefined();
            expect(dbProject.name).toBe("测试项目");
        });
        it("应该能获取项目列表", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "owner");
            // 创建多个项目
            await createTestProject(org.id, { name: "项目 A" });
            await createTestProject(org.id, { name: "项目 B" });
            await createTestProject(org.id, { name: "项目 C" });
            const projectList = await testDb
                .select()
                .from(projects)
                .where(eq(projects.organizationId, org.id));
            expect(projectList).toHaveLength(3);
        });
        it("应该能更新项目", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            const project = await createTestProject(org.id, { name: "原始名称" });
            await testDb
                .update(projects)
                .set({ name: "更新后的名称", updatedAt: new Date() })
                .where(eq(projects.id, project.id));
            const [updated] = await testDb
                .select()
                .from(projects)
                .where(eq(projects.id, project.id));
            expect(updated.name).toBe("更新后的名称");
        });
        it("应该能删除项目及其关联数据", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            const project = await createTestProject(org.id);
            // 添加项目成员
            await testDb.insert(projectMembers).values({
                id: crypto.randomUUID(),
                projectId: project.id,
                userId: user.id,
                createdAt: new Date(),
            });
            // 添加任务
            await createTestTask(project.id, org.id, { title: "测试任务" });
            // 删除项目（级联删除应该删除成员和任务）
            await testDb.delete(projects).where(eq(projects.id, project.id));
            // 验证项目已删除
            const [deletedProject] = await testDb
                .select()
                .from(projects)
                .where(eq(projects.id, project.id));
            expect(deletedProject).toBeUndefined();
            // 验证项目成员已级联删除
            const members = await testDb
                .select()
                .from(projectMembers)
                .where(eq(projectMembers.projectId, project.id));
            expect(members).toHaveLength(0);
            // 验证任务已级联删除
            const projectTasks = await testDb
                .select()
                .from(tasks)
                .where(eq(tasks.projectId, project.id));
            expect(projectTasks).toHaveLength(0);
        });
    });
    describe("项目成员", () => {
        it("应该能添加项目成员", async () => {
            const user1 = await createTestUser({ name: "用户1" });
            const user2 = await createTestUser({ name: "用户2" });
            const org = await createTestOrganization();
            const project = await createTestProject(org.id);
            // 添加两个成员
            await testDb.insert(projectMembers).values([
                {
                    id: crypto.randomUUID(),
                    projectId: project.id,
                    userId: user1.id,
                    createdAt: new Date(),
                },
                {
                    id: crypto.randomUUID(),
                    projectId: project.id,
                    userId: user2.id,
                    createdAt: new Date(),
                },
            ]);
            const members = await testDb
                .select()
                .from(projectMembers)
                .where(eq(projectMembers.projectId, project.id));
            expect(members).toHaveLength(2);
        });
    });
    describe("项目状态", () => {
        it("应该支持所有有效的项目状态", async () => {
            const org = await createTestOrganization();
            const statuses = ["planning", "active", "completed", "on_hold", "cancelled"];
            for (const status of statuses) {
                const project = await createTestProject(org.id, { status });
                expect(project.status).toBe(status);
            }
        });
    });
});
