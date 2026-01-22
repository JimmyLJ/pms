import { z } from "zod";
// Project Schemas
export const createProjectSchema = z.object({
    name: z.string().min(1, "Project name is required").max(100, "Project name must be 100 characters or less"),
    description: z.string().max(500, "Description must be 500 characters or less").optional().nullable(),
    status: z.enum(["planning", "active", "completed", "on_hold", "cancelled"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "low", "medium", "high"]).optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    leadId: z.string().optional().nullable(),
    memberIds: z.array(z.string()).optional(),
    workspaceId: z.string().min(1, "Workspace ID is required"),
});
export const updateProjectSchema = z.object({
    name: z.string().min(1, "Project name is required").max(100, "Project name must be 100 characters or less").optional(),
    description: z.string().max(500, "Description must be 500 characters or less").optional().nullable(),
    status: z.enum(["planning", "active", "completed", "on_hold", "cancelled"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "low", "medium", "high"]).optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    leadId: z.string().optional().nullable(),
    progress: z.number().min(0).max(100).optional(),
});
export const addProjectMemberSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
});
// Task Schemas
export const createTaskSchema = z.object({
    title: z.string().min(1, "Task title is required").max(200, "Task title must be 200 characters or less"),
    description: z.string().max(2000, "Description must be 2000 characters or less").optional().nullable(),
    projectId: z.string().min(1, "Project ID is required"),
    workspaceId: z.string().min(1, "Workspace ID is required"),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    type: z.enum(["BUG", "FEATURE", "TASK", "IMPROVEMENT", "OTHER"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    dueDate: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
});
export const updateTaskSchema = z.object({
    title: z.string().min(1, "Task title is required").max(200, "Task title must be 200 characters or less").optional(),
    description: z.string().max(2000, "Description must be 2000 characters or less").optional().nullable(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    type: z.enum(["BUG", "FEATURE", "TASK", "IMPROVEMENT", "OTHER"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    dueDate: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    position: z.number().int().min(0).optional(),
});
// Organization Schemas
export const addOrgMemberSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    role: z.enum(["member", "admin"]).optional().default("member"),
});
// Query Schemas
export const userSearchQuerySchema = z.object({
    q: z.string().optional(),
    workspaceId: z.string().min(1, "Workspace ID is required"),
});
export const searchQuerySchema = z.object({
    q: z.string().optional(),
    workspaceId: z.string().min(1, "Workspace ID is required"),
});
export const dashboardQuerySchema = z.object({
    workspaceId: z.string().min(1, "Workspace ID is required"),
});
