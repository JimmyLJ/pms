import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { store } from "@/store";
import DashboardPage from "./dashboard";

// Mock authClient
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: {
          id: "user-1",
          name: "测试用户",
          email: "test@example.com",
        },
      },
      isPending: false,
    }),
  },
}));

// Mock apiFetch
vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api-client";

const mockDashboardData = {
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
      recentProjects: [
        {
          id: "project-1",
          name: "测试项目",
          description: "这是一个测试项目",
          status: "active",
          priority: "medium",
          progress: 50,
          createdAt: new Date().toISOString(),
        },
      ],
      recentActivity: [
        {
          id: "task-1",
          title: "测试任务 1",
          type: "TASK",
          status: "TODO",
          createdAt: new Date().toISOString(),
          assignee: { name: "张三", image: null },
        },
      ],
      myStats: {
        inProgress: [{ id: "task-2", title: "进行中任务", dueDate: null }],
        overdue: [],
        recent: [{ id: "task-3", title: "我的任务", dueDate: null }],
      },
    },
  },
};

const emptyDashboardData = {
  data: {
    counts: {
      totalProjects: 0,
      completedProjects: 0,
      globalOverdue: 0,
      myTasks: 0,
      taskStatusCounts: [],
    },
    lists: {
      recentProjects: [],
      recentActivity: [],
      myStats: {
        inProgress: [],
        overdue: [],
        recent: [],
      },
    },
  },
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function renderDashboard(workspaceId = "workspace-1") {
  const queryClient = createTestQueryClient();

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/w/${workspaceId}`]}>
          <Routes>
            <Route path="/w/:workspaceId" element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该显示加载状态", () => {
    vi.mocked(apiFetch).mockImplementation(() => new Promise(() => {})); // 永不 resolve

    renderDashboard();

    // 检查是否有 Skeleton 加载组件（通过检查多个 skeleton 元素）
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("应该显示欢迎信息", async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockDashboardData);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/欢迎回来/)).toBeInTheDocument();
    });
  });

  it("应该显示统计卡片", async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockDashboardData);

    renderDashboard();

    await waitFor(() => {
      // 检查四个统计卡片的标题
      expect(screen.getByText("项目总数")).toBeInTheDocument();
      expect(screen.getByText("已完成项目")).toBeInTheDocument();
      expect(screen.getAllByText("我的任务").length).toBeGreaterThan(0);
      expect(screen.getByText("逾期任务")).toBeInTheDocument();
      // 检查数值存在（不用精确匹配，因为数字可能重复出现）
      expect(screen.getByText("5")).toBeInTheDocument(); // totalProjects
    });
  });

  it("应该显示项目列表", async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockDashboardData);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("项目概览")).toBeInTheDocument();
      expect(screen.getByText("测试项目")).toBeInTheDocument();
      expect(screen.getByText("这是一个测试项目")).toBeInTheDocument();
    });
  });

  it("应该显示最近活动", async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockDashboardData);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("最近活动")).toBeInTheDocument();
      expect(screen.getByText("测试任务 1")).toBeInTheDocument();
    });
  });

  it("无项目时应该显示空状态", async () => {
    vi.mocked(apiFetch).mockResolvedValue(emptyDashboardData);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("暂无项目")).toBeInTheDocument();
      expect(screen.getByText("创建您的第一个项目")).toBeInTheDocument();
    });
  });

  it("无最近活动时应该显示空状态", async () => {
    vi.mocked(apiFetch).mockResolvedValue(emptyDashboardData);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("暂无最近活动")).toBeInTheDocument();
    });
  });

  it("应该显示我的任务侧边栏", async () => {
    vi.mocked(apiFetch).mockResolvedValue(mockDashboardData);

    renderDashboard();

    await waitFor(() => {
      // 检查侧边栏的任务卡片标题
      // "我的任务"会出现在统计卡片和侧边栏中，使用 getAllByText
      expect(screen.getAllByText("我的任务").length).toBeGreaterThanOrEqual(2);
      // 检查逾期和进行中卡片
      expect(screen.getAllByText("逾期").length).toBeGreaterThan(0);
      expect(screen.getAllByText("进行中").length).toBeGreaterThan(0);
    });
  });
});
