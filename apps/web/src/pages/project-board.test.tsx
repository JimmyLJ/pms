import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { store } from "@/store";
import ProjectBoardPage from "./project-board";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock authClient
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: { id: "user-1", name: "测试用户", email: "test@example.com" },
        session: { activeOrganizationId: "workspace-1" },
      },
      isPending: false,
    }),
  },
}));

// Mock apiFetch
vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn(),
}));

// Mock child components that are complex
vi.mock("@/components/kanban/create-task-modal", () => ({
  CreateTaskModal: () => <button>创建任务</button>,
}));

vi.mock("@/components/analytics/project-analytics", () => ({
  ProjectAnalytics: () => <div>项目分析内容</div>,
}));

vi.mock("@/components/settings/project-settings", () => ({
  ProjectSettings: () => <div>项目设置内容</div>,
}));

import { apiFetch } from "@/lib/api-client";

const mockProject = {
  id: "project-1",
  name: "测试项目",
  description: "这是一个测试项目",
  status: "active",
  priority: "medium",
  progress: 50,
  organizationId: "workspace-1",
  members: [
    { id: "m1", userId: "user-1", user: { name: "张三" } },
    { id: "m2", userId: "user-2", user: { name: "李四" } },
  ],
};

const mockTasks = [
  {
    id: "task-1",
    title: "修复登录页面 Bug",
    type: "BUG",
    status: "TODO",
    priority: "high",
    projectId: "project-1",
    assignee: { id: "user-1", name: "张三", image: null },
    dueDate: null,
  },
  {
    id: "task-2",
    title: "添加搜索功能",
    type: "FEATURE",
    status: "IN_PROGRESS",
    priority: "medium",
    projectId: "project-1",
    assignee: { id: "user-2", name: "李四", image: null },
    dueDate: "2026-03-15",
  },
  {
    id: "task-3",
    title: "优化性能",
    type: "IMPROVEMENT",
    status: "DONE",
    priority: "low",
    projectId: "project-1",
    assignee: null,
    dueDate: "2026-02-20",
  },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderProjectBoard(tab = "tasks") {
  const queryClient = createTestQueryClient();

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={[`/w/workspace-1/projects/project-1?tab=${tab}`]}
        >
          <Routes>
            <Route
              path="/w/:workspaceId/projects/:projectId"
              element={<ProjectBoardPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("ProjectBoardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 默认 mock apiFetch 根据 URL 返回不同数据
    vi.mocked(apiFetch).mockImplementation((url: string) => {
      if (url.includes("/api/projects/")) {
        return Promise.resolve({ data: mockProject });
      }
      if (url.includes("/api/tasks")) {
        return Promise.resolve({ data: mockTasks });
      }
      return Promise.resolve({});
    });
  });

  // ==================== 加载和基本渲染 ====================

  describe("加载和基本渲染", () => {
    it("加载中应该显示 Skeleton 骨架屏", () => {
      vi.mocked(apiFetch).mockImplementation(() => new Promise(() => {}));

      renderProjectBoard();

      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("应该显示项目名称", async () => {
      renderProjectBoard();

      await waitFor(() => {
        expect(screen.getByText("测试项目")).toBeInTheDocument();
      });
    });

    it("应该显示项目状态 Badge", async () => {
      renderProjectBoard();

      await waitFor(() => {
        // '进行中' may appear in both status badge and stat card
        const elements = screen.getAllByText("进行中");
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it("应该显示统计卡片", async () => {
      renderProjectBoard();

      await waitFor(() => {
        expect(screen.getByText("任务总数")).toBeInTheDocument();
        // '已完成' may appear in stat card and filter dropdown
        expect(screen.getAllByText("已完成").length).toBeGreaterThan(0);
        expect(screen.getByText("团队成员")).toBeInTheDocument();
      });
    });

    it("应该显示创建任务按钮", async () => {
      renderProjectBoard();

      await waitFor(() => {
        expect(screen.getByText("创建任务")).toBeInTheDocument();
      });
    });
  });

  // ==================== Tab 导航 ====================

  describe("Tab 导航", () => {
    it("应该显示所有 Tab", async () => {
      renderProjectBoard();

      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /任务/ })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /日历/ })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /分析/ })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /设置/ })).toBeInTheDocument();
      });
    });

    it("默认应该显示任务 Tab 内容", async () => {
      renderProjectBoard();

      await waitFor(() => {
        expect(screen.getByText("标题")).toBeInTheDocument(); // 表头
        expect(screen.getByText("类型")).toBeInTheDocument();
        expect(screen.getByText("优先级")).toBeInTheDocument();
      });
    });
  });

  // ==================== 任务列表 ====================

  describe("任务列表", () => {
    it("应该显示所有任务", async () => {
      renderProjectBoard();

      await waitFor(() => {
        expect(screen.getByText("修复登录页面 Bug")).toBeInTheDocument();
        expect(screen.getByText("添加搜索功能")).toBeInTheDocument();
        expect(screen.getByText("优化性能")).toBeInTheDocument();
      });
    });

    it("应该显示任务类型标签", async () => {
      renderProjectBoard();

      await waitFor(() => {
        expect(screen.getByText("缺陷")).toBeInTheDocument(); // BUG
        expect(screen.getByText("功能")).toBeInTheDocument(); // FEATURE
        expect(screen.getByText("优化")).toBeInTheDocument(); // IMPROVEMENT
      });
    });

    it("应该显示任务负责人", async () => {
      renderProjectBoard();

      await waitFor(() => {
        expect(screen.getByText("张三")).toBeInTheDocument();
        expect(screen.getByText("李四")).toBeInTheDocument();
      });
    });

    it("无任务时应该显示空状态", async () => {
      vi.mocked(apiFetch).mockImplementation((url: string) => {
        if (url.includes("/api/projects/")) {
          return Promise.resolve({ data: mockProject });
        }
        if (url.includes("/api/tasks")) {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({});
      });

      renderProjectBoard();

      await waitFor(() => {
        expect(
          screen.getByText("没有找到符合筛选条件的任务"),
        ).toBeInTheDocument();
      });
    });
  });

  // ==================== 日历 Tab ====================

  describe("日历 Tab", () => {
    it("应该显示日历内容", async () => {
      renderProjectBoard("calendar");

      await waitFor(() => {
        expect(screen.getByText("任务日历")).toBeInTheDocument();
      });
    });

    it("应该显示星期标题", async () => {
      renderProjectBoard("calendar");

      await waitFor(() => {
        expect(screen.getByText("日")).toBeInTheDocument();
        expect(screen.getByText("一")).toBeInTheDocument();
        expect(screen.getByText("二")).toBeInTheDocument();
        expect(screen.getByText("三")).toBeInTheDocument();
        expect(screen.getByText("四")).toBeInTheDocument();
        expect(screen.getByText("五")).toBeInTheDocument();
        expect(screen.getByText("六")).toBeInTheDocument();
      });
    });

    it("应该显示即将到期和已逾期部分", async () => {
      renderProjectBoard("calendar");

      await waitFor(() => {
        expect(screen.getByText("即将到期")).toBeInTheDocument();
        expect(screen.getByText(/已逾期/)).toBeInTheDocument();
      });
    });
  });

  // ==================== 分析和设置 Tab ====================

  describe("分析和设置 Tab", () => {
    it("应该显示分析 Tab 内容", async () => {
      renderProjectBoard("analytics");

      await waitFor(() => {
        expect(screen.getByText("项目分析内容")).toBeInTheDocument();
      });
    });

    it("应该显示设置 Tab 内容", async () => {
      renderProjectBoard("settings");

      await waitFor(() => {
        expect(screen.getByText("项目设置内容")).toBeInTheDocument();
      });
    });
  });

  // ==================== 删除任务 ====================

  describe("删除任务", () => {
    it("点击删除按钮应该打开确认弹窗", async () => {
      const user = userEvent.setup();
      renderProjectBoard();

      await waitFor(() => {
        expect(screen.getByText("修复登录页面 Bug")).toBeInTheDocument();
      });

      // 找到所有删除按钮（每行任务都有一个）
      const deleteButtons = document.querySelectorAll(
        'button[class*="hover:text-red"]',
      );
      expect(deleteButtons.length).toBeGreaterThan(0);

      await user.click(deleteButtons[0] as HTMLElement);

      await waitFor(() => {
        expect(screen.getByText("确认删除")).toBeInTheDocument();
      });
    });
  });
});
