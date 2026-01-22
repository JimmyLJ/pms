import { testDb } from "./db";
import * as schema from "../db/schema";
/**
 * 生成唯一 ID
 */
export function generateId() {
    return crypto.randomUUID();
}
/**
 * 创建测试用户
 */
export async function createTestUser(overrides = {}) {
    const id = generateId();
    const now = new Date();
    const userData = {
        id,
        name: `Test User ${id.slice(0, 8)}`,
        email: `test-${id.slice(0, 8)}@example.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
    await testDb.insert(schema.user).values(userData);
    return userData;
}
/**
 * 创建测试会话（用于模拟认证）
 */
export async function createTestSession(userId, organizationId) {
    const id = generateId();
    const now = new Date();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期
    const sessionData = {
        id,
        token: `test-token-${id}`,
        userId,
        activeOrganizationId: organizationId || null,
        expiresAt,
        createdAt: now,
        updatedAt: now,
    };
    await testDb.insert(schema.session).values(sessionData);
    return sessionData;
}
/**
 * 创建测试组织
 */
export async function createTestOrganization(overrides = {}) {
    const id = generateId();
    const now = new Date();
    const orgData = {
        id,
        name: `Test Organization ${id.slice(0, 8)}`,
        slug: `test-org-${id.slice(0, 8)}`,
        createdAt: now,
        ...overrides,
    };
    await testDb.insert(schema.organization).values(orgData);
    return orgData;
}
/**
 * 创建组织成员
 */
export async function createTestMember(organizationId, userId, role = "member") {
    const id = generateId();
    const now = new Date();
    const memberData = {
        id,
        organizationId,
        userId,
        role,
        createdAt: now,
    };
    await testDb.insert(schema.member).values(memberData);
    return memberData;
}
/**
 * 创建测试项目
 */
export async function createTestProject(organizationId, overrides = {}) {
    const id = generateId();
    const now = new Date();
    const projectData = {
        id,
        name: `Test Project ${id.slice(0, 8)}`,
        organizationId,
        status: "active",
        priority: "medium",
        progress: 0,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
    await testDb.insert(schema.projects).values(projectData);
    return projectData;
}
/**
 * 创建测试任务
 */
export async function createTestTask(projectId, organizationId, overrides = {}) {
    const id = generateId();
    const now = new Date();
    const taskData = {
        id,
        title: `Test Task ${id.slice(0, 8)}`,
        projectId,
        organizationId,
        status: "TODO",
        type: "TASK",
        priority: "MEDIUM",
        position: 0,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
    await testDb.insert(schema.tasks).values(taskData);
    return taskData;
}
/**
 * 创建完整的测试环境（用户 + 组织 + 成员关系）
 */
export async function createTestEnvironment() {
    const user = await createTestUser();
    const organization = await createTestOrganization();
    await createTestMember(organization.id, user.id, "owner");
    const session = await createTestSession(user.id, organization.id);
    return { user, organization, session };
}
/**
 * 获取认证请求头
 */
export function getAuthHeaders(sessionToken) {
    return {
        Cookie: `better-auth.session_token=${sessionToken}`,
    };
}
/**
 * 创建认证请求
 */
export function createAuthRequest(url, sessionToken, options = {}) {
    const headers = new Headers(options.headers);
    headers.set("Cookie", `better-auth.session_token=${sessionToken}`);
    return new Request(url, {
        ...options,
        headers,
    });
}
