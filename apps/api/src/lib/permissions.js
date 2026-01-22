import { db } from "../db";
import { member, projects, projectMembers } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
// 组织角色优先级（数值越大权限越高）
const ORG_ROLE_PRIORITY = {
    member: 1,
    admin: 2,
    owner: 3,
};
// 项目角色优先级
const PROJECT_ROLE_PRIORITY = {
    member: 1,
    lead: 2,
};
// 项目访问级别对应的最低项目角色要求
const ACCESS_LEVEL_MIN_PROJECT_ROLE = {
    view: "member",
    edit: "lead",
    admin: "lead",
};
/**
 * 获取用户在组织中的角色
 */
export async function getOrgRole(userId, orgId) {
    const [memberRecord] = await db
        .select({ role: member.role })
        .from(member)
        .where(and(eq(member.userId, userId), eq(member.organizationId, orgId)))
        .limit(1);
    return memberRecord?.role || null;
}
/**
 * 获取用户在项目中的角色
 */
export async function getProjectRole(userId, projectId) {
    // 获取项目信息，检查是否是 lead
    const [project] = await db
        .select({ leadId: projects.leadId })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
    if (!project)
        return null;
    if (project.leadId === userId) {
        return "lead";
    }
    // 检查是否是项目成员
    const [projectMember] = await db
        .select({ id: projectMembers.id })
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
        .limit(1);
    return projectMember ? "member" : null;
}
/**
 * 获取项目所属的组织 ID
 */
export async function getProjectOrgId(projectId) {
    const [project] = await db
        .select({ organizationId: projects.organizationId })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
    return project?.organizationId || null;
}
/**
 * 检查用户是否具有指定的组织角色（或更高）
 * @throws HTTPException 403 如果权限不足
 */
export async function requireOrgRole(userId, orgId, minRole) {
    const role = await getOrgRole(userId, orgId);
    if (!role) {
        throw new HTTPException(403, { message: "Not a member of this organization" });
    }
    if (ORG_ROLE_PRIORITY[role] < ORG_ROLE_PRIORITY[minRole]) {
        throw new HTTPException(403, { message: `Requires ${minRole} role or higher` });
    }
    return role;
}
/**
 * 检查用户是否具有指定的项目访问权限
 * 组织 admin/owner 自动拥有所有项目的完整权限（穿透）
 * @throws HTTPException 403 如果权限不足
 * @throws HTTPException 404 如果项目不存在
 */
export async function requireProjectAccess(userId, projectId, level) {
    // 获取项目所属组织
    const orgId = await getProjectOrgId(projectId);
    if (!orgId) {
        throw new HTTPException(404, { message: "Project not found" });
    }
    // 获取组织角色
    const orgRole = await getOrgRole(userId, orgId);
    if (!orgRole) {
        throw new HTTPException(403, { message: "Not a member of this organization" });
    }
    // 组织 admin/owner 拥有穿透权限
    if (ORG_ROLE_PRIORITY[orgRole] >= ORG_ROLE_PRIORITY["admin"]) {
        return { orgRole, projectRole: null };
    }
    // 普通成员需要检查项目级权限
    const projectRole = await getProjectRole(userId, projectId);
    if (!projectRole) {
        throw new HTTPException(403, { message: "Not a member of this project" });
    }
    const minProjectRole = ACCESS_LEVEL_MIN_PROJECT_ROLE[level];
    if (PROJECT_ROLE_PRIORITY[projectRole] < PROJECT_ROLE_PRIORITY[minProjectRole]) {
        throw new HTTPException(403, { message: `Requires project ${minProjectRole} role or higher` });
    }
    return { orgRole, projectRole };
}
/**
 * 检查用户是否是组织的 admin 或 owner
 */
export async function isOrgAdmin(userId, orgId) {
    const role = await getOrgRole(userId, orgId);
    return role !== null && ORG_ROLE_PRIORITY[role] >= ORG_ROLE_PRIORITY["admin"];
}
/**
 * 检查用户是否是组织的 owner
 * @throws HTTPException 403 如果不是 owner
 */
export async function requireOrgOwner(userId, orgId) {
    const role = await getOrgRole(userId, orgId);
    if (!role) {
        throw new HTTPException(403, { message: "Not a member of this organization" });
    }
    if (role !== "owner") {
        throw new HTTPException(403, { message: "Only organization owner can perform this action" });
    }
}
/**
 * 检查用户是否有权限访问指定项目（view 级别）
 * 用于过滤列表结果
 */
export async function canAccessProject(userId, projectId) {
    try {
        await requireProjectAccess(userId, projectId, "view");
        return true;
    }
    catch {
        return false;
    }
}
