import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  createTaskSchema,
  updateTaskSchema,
  addOrgMemberSchema,
  userSearchQuerySchema,
  searchQuerySchema,
  dashboardQuerySchema,
} from "./validators";

describe("Validators", () => {
  // ==================== Project Schemas ====================

  describe("createProjectSchema", () => {
    it("应该接受有效的最小项目数据", () => {
      const result = createProjectSchema.safeParse({
        name: "My Project",
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(true);
    });

    it("应该接受包含所有字段的完整项目数据", () => {
      const result = createProjectSchema.safeParse({
        name: "My Project",
        description: "A test project",
        status: "active",
        priority: "HIGH",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        leadId: "user-123",
        memberIds: ["user-1", "user-2"],
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(true);
    });

    it("name 为空时应该拒绝", () => {
      const result = createProjectSchema.safeParse({
        name: "",
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Project name is required");
      }
    });

    it("name 超过 100 字符时应该拒绝", () => {
      const result = createProjectSchema.safeParse({
        name: "a".repeat(101),
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Project name must be 100 characters or less"
        );
      }
    });

    it("缺少 name 时应该拒绝", () => {
      const result = createProjectSchema.safeParse({
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(false);
    });

    it("workspaceId 为空时应该拒绝", () => {
      const result = createProjectSchema.safeParse({
        name: "My Project",
        workspaceId: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Workspace ID is required");
      }
    });

    it("缺少 workspaceId 时应该拒绝", () => {
      const result = createProjectSchema.safeParse({
        name: "My Project",
      });
      expect(result.success).toBe(false);
    });

    it("description 超过 500 字符时应该拒绝", () => {
      const result = createProjectSchema.safeParse({
        name: "My Project",
        workspaceId: "workspace-123",
        description: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("description 为 null 时应该接受", () => {
      const result = createProjectSchema.safeParse({
        name: "My Project",
        workspaceId: "workspace-123",
        description: null,
      });
      expect(result.success).toBe(true);
    });

    it("应该接受所有有效的 status 值", () => {
      const validStatuses = ["planning", "active", "completed", "on_hold", "cancelled"];
      for (const status of validStatuses) {
        const result = createProjectSchema.safeParse({
          name: "Test",
          workspaceId: "ws-1",
          status,
        });
        expect(result.success).toBe(true);
      }
    });

    it("无效的 status 值应该拒绝", () => {
      const result = createProjectSchema.safeParse({
        name: "Test",
        workspaceId: "ws-1",
        status: "invalid_status",
      });
      expect(result.success).toBe(false);
    });

    it("应该接受大小写都有效的 priority 值", () => {
      const validPriorities = ["LOW", "MEDIUM", "HIGH", "low", "medium", "high"];
      for (const priority of validPriorities) {
        const result = createProjectSchema.safeParse({
          name: "Test",
          workspaceId: "ws-1",
          priority,
        });
        expect(result.success).toBe(true);
      }
    });

    it("无效的 priority 值应该拒绝", () => {
      const result = createProjectSchema.safeParse({
        name: "Test",
        workspaceId: "ws-1",
        priority: "CRITICAL",
      });
      expect(result.success).toBe(false);
    });

    it("startDate 和 endDate 可以为 null", () => {
      const result = createProjectSchema.safeParse({
        name: "Test",
        workspaceId: "ws-1",
        startDate: null,
        endDate: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateProjectSchema", () => {
    it("应该接受空对象（所有字段可选）", () => {
      const result = updateProjectSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("应该接受仅更新 name", () => {
      const result = updateProjectSchema.safeParse({ name: "Updated Name" });
      expect(result.success).toBe(true);
    });

    it("name 为空字符串时应该拒绝", () => {
      const result = updateProjectSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("应该接受 progress 在 0-100 范围内", () => {
      const result = updateProjectSchema.safeParse({ progress: 50 });
      expect(result.success).toBe(true);
    });

    it("progress 小于 0 时应该拒绝", () => {
      const result = updateProjectSchema.safeParse({ progress: -1 });
      expect(result.success).toBe(false);
    });

    it("progress 大于 100 时应该拒绝", () => {
      const result = updateProjectSchema.safeParse({ progress: 101 });
      expect(result.success).toBe(false);
    });

    it("progress 边界值 0 和 100 应该接受", () => {
      expect(updateProjectSchema.safeParse({ progress: 0 }).success).toBe(true);
      expect(updateProjectSchema.safeParse({ progress: 100 }).success).toBe(true);
    });
  });

  describe("addProjectMemberSchema", () => {
    it("应该接受有效的 userId", () => {
      const result = addProjectMemberSchema.safeParse({ userId: "user-123" });
      expect(result.success).toBe(true);
    });

    it("userId 为空时应该拒绝", () => {
      const result = addProjectMemberSchema.safeParse({ userId: "" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("User ID is required");
      }
    });

    it("缺少 userId 时应该拒绝", () => {
      const result = addProjectMemberSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ==================== Task Schemas ====================

  describe("createTaskSchema", () => {
    it("应该接受有效的最小任务数据", () => {
      const result = createTaskSchema.safeParse({
        title: "Fix bug",
        projectId: "project-123",
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(true);
    });

    it("应该接受包含所有字段的完整任务数据", () => {
      const result = createTaskSchema.safeParse({
        title: "Fix bug",
        description: "Fix the login bug",
        projectId: "project-123",
        workspaceId: "workspace-123",
        status: "IN_PROGRESS",
        type: "BUG",
        priority: "HIGH",
        dueDate: "2026-03-01",
        assigneeId: "user-123",
      });
      expect(result.success).toBe(true);
    });

    it("title 为空时应该拒绝", () => {
      const result = createTaskSchema.safeParse({
        title: "",
        projectId: "project-123",
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Task title is required");
      }
    });

    it("title 超过 200 字符时应该拒绝", () => {
      const result = createTaskSchema.safeParse({
        title: "a".repeat(201),
        projectId: "project-123",
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(false);
    });

    it("description 超过 2000 字符时应该拒绝", () => {
      const result = createTaskSchema.safeParse({
        title: "Task",
        projectId: "project-123",
        workspaceId: "workspace-123",
        description: "a".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("缺少 projectId 时应该拒绝", () => {
      const result = createTaskSchema.safeParse({
        title: "Task",
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(false);
    });

    it("缺少 workspaceId 时应该拒绝", () => {
      const result = createTaskSchema.safeParse({
        title: "Task",
        projectId: "project-123",
      });
      expect(result.success).toBe(false);
    });

    it("应该接受所有有效的 status 值", () => {
      const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
      for (const status of validStatuses) {
        const result = createTaskSchema.safeParse({
          title: "Task",
          projectId: "p-1",
          workspaceId: "ws-1",
          status,
        });
        expect(result.success).toBe(true);
      }
    });

    it("无效的 status 值应该拒绝", () => {
      const result = createTaskSchema.safeParse({
        title: "Task",
        projectId: "p-1",
        workspaceId: "ws-1",
        status: "PENDING",
      });
      expect(result.success).toBe(false);
    });

    it("应该接受所有有效的 type 值", () => {
      const validTypes = ["BUG", "FEATURE", "TASK", "IMPROVEMENT", "OTHER"];
      for (const type of validTypes) {
        const result = createTaskSchema.safeParse({
          title: "Task",
          projectId: "p-1",
          workspaceId: "ws-1",
          type,
        });
        expect(result.success).toBe(true);
      }
    });

    it("应该接受所有有效的 priority 值", () => {
      const validPriorities = ["LOW", "MEDIUM", "HIGH"];
      for (const priority of validPriorities) {
        const result = createTaskSchema.safeParse({
          title: "Task",
          projectId: "p-1",
          workspaceId: "ws-1",
          priority,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("updateTaskSchema", () => {
    it("应该接受空对象（所有字段可选）", () => {
      const result = updateTaskSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("应该接受仅更新 title", () => {
      const result = updateTaskSchema.safeParse({ title: "Updated Title" });
      expect(result.success).toBe(true);
    });

    it("title 为空字符串时应该拒绝", () => {
      const result = updateTaskSchema.safeParse({ title: "" });
      expect(result.success).toBe(false);
    });

    it("应该接受有效的 position 值", () => {
      const result = updateTaskSchema.safeParse({ position: 0 });
      expect(result.success).toBe(true);
    });

    it("position 为负数时应该拒绝", () => {
      const result = updateTaskSchema.safeParse({ position: -1 });
      expect(result.success).toBe(false);
    });

    it("position 为小数时应该拒绝", () => {
      const result = updateTaskSchema.safeParse({ position: 1.5 });
      expect(result.success).toBe(false);
    });

    it("description 为 null 时应该接受", () => {
      const result = updateTaskSchema.safeParse({ description: null });
      expect(result.success).toBe(true);
    });

    it("assigneeId 为 null 时应该接受（取消分配）", () => {
      const result = updateTaskSchema.safeParse({ assigneeId: null });
      expect(result.success).toBe(true);
    });
  });

  // ==================== Organization Schemas ====================

  describe("addOrgMemberSchema", () => {
    it("应该接受有效的最小数据", () => {
      const result = addOrgMemberSchema.safeParse({ userId: "user-123" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("member"); // 默认值
      }
    });

    it("应该接受指定 role 为 admin", () => {
      const result = addOrgMemberSchema.safeParse({
        userId: "user-123",
        role: "admin",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("admin");
      }
    });

    it("应该接受指定 role 为 member", () => {
      const result = addOrgMemberSchema.safeParse({
        userId: "user-123",
        role: "member",
      });
      expect(result.success).toBe(true);
    });

    it("无效的 role 值应该拒绝", () => {
      const result = addOrgMemberSchema.safeParse({
        userId: "user-123",
        role: "owner",
      });
      expect(result.success).toBe(false);
    });

    it("userId 为空时应该拒绝", () => {
      const result = addOrgMemberSchema.safeParse({ userId: "" });
      expect(result.success).toBe(false);
    });

    it("缺少 userId 时应该拒绝", () => {
      const result = addOrgMemberSchema.safeParse({ role: "admin" });
      expect(result.success).toBe(false);
    });
  });

  // ==================== Query Schemas ====================

  describe("userSearchQuerySchema", () => {
    it("应该接受有效的搜索查询", () => {
      const result = userSearchQuerySchema.safeParse({
        q: "test",
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(true);
    });

    it("q 可选，应该接受仅含 workspaceId 的数据", () => {
      const result = userSearchQuerySchema.safeParse({
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(true);
    });

    it("workspaceId 为空时应该拒绝", () => {
      const result = userSearchQuerySchema.safeParse({
        q: "test",
        workspaceId: "",
      });
      expect(result.success).toBe(false);
    });

    it("缺少 workspaceId 时应该拒绝", () => {
      const result = userSearchQuerySchema.safeParse({ q: "test" });
      expect(result.success).toBe(false);
    });
  });

  describe("searchQuerySchema", () => {
    it("应该接受有效的搜索查询", () => {
      const result = searchQuerySchema.safeParse({
        q: "keyword",
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(true);
    });

    it("q 可选", () => {
      const result = searchQuerySchema.safeParse({
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(true);
    });

    it("缺少 workspaceId 时应该拒绝", () => {
      const result = searchQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("dashboardQuerySchema", () => {
    it("应该接受有效的 workspaceId", () => {
      const result = dashboardQuerySchema.safeParse({
        workspaceId: "workspace-123",
      });
      expect(result.success).toBe(true);
    });

    it("workspaceId 为空时应该拒绝", () => {
      const result = dashboardQuerySchema.safeParse({ workspaceId: "" });
      expect(result.success).toBe(false);
    });

    it("缺少 workspaceId 时应该拒绝", () => {
      const result = dashboardQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
