import { http, HttpResponse } from "msw";

// Mock 数据
export const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  image: null,
};

export const mockOrganization = {
  id: "org-1",
  name: "Test Organization",
  slug: "test-org",
  logo: null,
  createdAt: new Date().toISOString(),
};

export const mockProject = {
  id: "project-1",
  name: "Test Project",
  description: "A test project",
  status: "active",
  priority: "medium",
  progress: 50,
  organizationId: "org-1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  members: [mockUser],
};

export const mockTasks = [
  {
    id: "task-1",
    title: "Test Task 1",
    status: "TODO",
    type: "TASK",
    priority: "HIGH",
    projectId: "project-1",
    organizationId: "org-1",
    dueDate: new Date(Date.now() + 86400000).toISOString(), // 明天
    assignee: mockUser,
  },
  {
    id: "task-2",
    title: "Test Task 2",
    status: "IN_PROGRESS",
    type: "BUG",
    priority: "MEDIUM",
    projectId: "project-1",
    organizationId: "org-1",
    dueDate: null,
    assignee: null,
  },
];

// API handlers
export const handlers = [
  // 获取项目列表
  http.get("http://127.0.0.1:3000/api/projects", ({ request }) => {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId");

    if (!workspaceId) {
      return HttpResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    return HttpResponse.json({
      data: [mockProject],
      hasMore: false,
      nextCursor: null,
    });
  }),

  // 获取单个项目
  http.get("http://127.0.0.1:3000/api/projects/:projectId", ({ params }) => {
    const { projectId } = params;

    if (projectId === "not-found") {
      return HttpResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return HttpResponse.json({
      data: { ...mockProject, id: projectId },
    });
  }),

  // 创建项目
  http.post("http://127.0.0.1:3000/api/projects", async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;

    return HttpResponse.json({
      data: {
        ...mockProject,
        id: crypto.randomUUID(),
        name: body.name,
        description: body.description,
      },
    });
  }),

  // 获取任务列表
  http.get("http://127.0.0.1:3000/api/tasks", ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    return HttpResponse.json({
      data: mockTasks.filter((t) => !projectId || t.projectId === projectId),
    });
  }),

  // 创建任务
  http.post("http://127.0.0.1:3000/api/tasks", async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;

    return HttpResponse.json({
      data: {
        id: crypto.randomUUID(),
        title: body.title,
        status: body.status || "TODO",
        type: body.type || "TASK",
        priority: body.priority || "MEDIUM",
        projectId: body.projectId,
        organizationId: body.workspaceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  // 更新任务
  http.patch("http://127.0.0.1:3000/api/tasks/:taskId", async ({ params, request }) => {
    const { taskId } = params;
    const body = await request.json() as Record<string, unknown>;

    const task = mockTasks.find((t) => t.id === taskId);

    return HttpResponse.json({
      data: {
        ...task,
        ...body,
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  // 仪表盘数据
  http.get("http://127.0.0.1:3000/api/analytics/dashboard", () => {
    return HttpResponse.json({
      data: {
        counts: {
          totalProjects: 5,
          completedProjects: 2,
          globalOverdue: 1,
          myTasks: 3,
          taskStatusCounts: [
            { status: "TODO", count: 5 },
            { status: "IN_PROGRESS", count: 3 },
            { status: "DONE", count: 10 },
          ],
        },
        lists: {
          recentProjects: [mockProject],
          recentActivity: mockTasks,
          myStats: {
            inProgress: mockTasks.filter((t) => t.status === "IN_PROGRESS"),
            overdue: [],
            recent: mockTasks,
          },
        },
      },
    });
  }),
];
