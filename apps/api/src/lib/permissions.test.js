import { describe, it, expect } from "vitest";
import {
    getOrgRole,
    getProjectRole,
    requireOrgRole,
    requireProjectAccess,
    isOrgAdmin,
    canAccessProject,
} from "./permissions";
import {
    createTestUser,
    createTestOrganization,
    createTestMember,
    createTestProject,
    generateId,
} from "../test/helpers";
import { testDb } from "../test/db";
import { projectMembers } from "../db/schema";

describe("Permissions", () => {
    describe("getOrgRole", () => {
        it("应该返回用户在组织中的角色", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");

            const role = await getOrgRole(user.id, org.id);
            expect(role).toBe("admin");
        });

        it("用户不是组织成员时应该返回 null", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();

            const role = await getOrgRole(user.id, org.id);
            expect(role).toBeNull();
        });
    });

    describe("getProjectRole", () => {
        it("项目 lead 应该返回 lead 角色", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            const project = await createTestProject(org.id, { leadId: user.id });

            const role = await getProjectRole(user.id, project.id);
            expect(role).toBe("lead");
        });

        it("项目成员应该返回 member 角色", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            const project = await createTestProject(org.id);

            // 添加为项目成员
            await testDb.insert(projectMembers).values({
                id: generateId(),
                projectId: project.id,
                userId: user.id,
                createdAt: new Date(),
            });

            const role = await getProjectRole(user.id, project.id);
            expect(role).toBe("member");
        });

        it("非项目成员应该返回 null", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            const project = await createTestProject(org.id);

            const role = await getProjectRole(user.id, project.id);
            expect(role).toBeNull();
        });
    });

    describe("requireOrgRole", () => {
        it("角色满足要求时应该返回角色", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");

            const role = await requireOrgRole(user.id, org.id, "member");
            expect(role).toBe("admin");
        });

        it("角色不足时应该抛出 403 错误", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "member");

            await expect(requireOrgRole(user.id, org.id, "admin")).rejects.toThrow();
        });

        it("非组织成员应该抛出 403 错误", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();

            await expect(requireOrgRole(user.id, org.id, "member")).rejects.toThrow();
        });
    });

    describe("requireProjectAccess", () => {
        it("组织 admin 应该拥有所有项目的穿透权限", async () => {
            const admin = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, admin.id, "admin");

            // 创建项目，admin 不是项目成员
            const project = await createTestProject(org.id);

            // admin 应该能访问任何权限级别
            const result = await requireProjectAccess(admin.id, project.id, "admin");
            expect(result.orgRole).toBe("admin");
            expect(result.projectRole).toBeNull(); // 穿透权限，不需要项目角色
        });

        it("组织 owner 应该拥有所有项目的穿透权限", async () => {
            const owner = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, owner.id, "owner");

            const project = await createTestProject(org.id);

            const result = await requireProjectAccess(owner.id, project.id, "edit");
            expect(result.orgRole).toBe("owner");
        });

        it("普通成员需要项目级权限 - view 级别", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "member");

            const project = await createTestProject(org.id);
            await testDb.insert(projectMembers).values({
                id: generateId(),
                projectId: project.id,
                userId: user.id,
                createdAt: new Date(),
            });

            // 项目成员可以 view
            const result = await requireProjectAccess(user.id, project.id, "view");
            expect(result.projectRole).toBe("member");
        });

        it("普通成员 edit 级别需要 lead 角色", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "member");

            // user 是项目 lead
            const project = await createTestProject(org.id, { leadId: user.id });

            const result = await requireProjectAccess(user.id, project.id, "edit");
            expect(result.projectRole).toBe("lead");
        });

        it("项目 member 尝试 edit 应该抛出 403", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "member");

            const project = await createTestProject(org.id);
            await testDb.insert(projectMembers).values({
                id: generateId(),
                projectId: project.id,
                userId: user.id,
                createdAt: new Date(),
            });

            // 项目 member 不能 edit
            await expect(requireProjectAccess(user.id, project.id, "edit")).rejects.toThrow();
        });

        it("非项目成员应该抛出 403", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "member");

            const project = await createTestProject(org.id);
            // user 不是项目成员

            await expect(requireProjectAccess(user.id, project.id, "view")).rejects.toThrow();
        });

        it("项目不存在应该抛出 404", async () => {
            const user = await createTestUser();

            await expect(requireProjectAccess(user.id, "non-existent-id", "view")).rejects.toThrow();
        });
    });

    describe("isOrgAdmin", () => {
        it("admin 应该返回 true", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");

            expect(await isOrgAdmin(user.id, org.id)).toBe(true);
        });

        it("owner 应该返回 true", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "owner");

            expect(await isOrgAdmin(user.id, org.id)).toBe(true);
        });

        it("member 应该返回 false", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "member");

            expect(await isOrgAdmin(user.id, org.id)).toBe(false);
        });
    });

    describe("canAccessProject", () => {
        it("有权限时应该返回 true", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "admin");
            const project = await createTestProject(org.id);

            expect(await canAccessProject(user.id, project.id)).toBe(true);
        });

        it("无权限时应该返回 false", async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await createTestMember(org.id, user.id, "member");
            const project = await createTestProject(org.id);
            // user 不是项目成员

            expect(await canAccessProject(user.id, project.id)).toBe(false);
        });
    });
});
