import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { store } from "@/store";
import { CreateProjectModal } from "./create-project-modal";
import { Button } from "@/components/ui/button";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock authClient
const mockOrganizationList = vi.fn();
const mockGetFullOrganization = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    organization: {
      list: () => mockOrganizationList(),
      getFullOrganization: (params: any) => mockGetFullOrganization(params),
    },
  },
}));

// Mock apiFetch
vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api-client";
import { toast } from "react-hot-toast";

const mockOrganizations = [
  {
    id: "workspace-1",
    name: "测试工作区",
    slug: "test-workspace",
  },
];

const mockMembersData = {
  members: [
    {
      id: "member-1",
      user: { id: "user-1", name: "张三", email: "zhang@example.com" },
    },
    {
      id: "member-2",
      user: { id: "user-2", name: "李四", email: "li@example.com" },
    },
  ],
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function renderModal(workspaceId = "workspace-1") {
  const queryClient = createTestQueryClient();

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/w/${workspaceId}`]}>
          <Routes>
            <Route
              path="/w/:workspaceId"
              element={
                <CreateProjectModal>
                  <Button>打开模态框</Button>
                </CreateProjectModal>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe("CreateProjectModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrganizationList.mockResolvedValue({ data: mockOrganizations });
    mockGetFullOrganization.mockResolvedValue({ data: mockMembersData });
    vi.mocked(apiFetch).mockResolvedValue({ data: { id: "new-project-id" } });
  });

  it("点击触发器应该打开模态框", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("打开模态框"));

    await waitFor(() => {
      expect(screen.getByText("创建新项目")).toBeInTheDocument();
    });
  });

  it("应该显示工作区名称", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("打开模态框"));

    await waitFor(() => {
      expect(screen.getByText("测试工作区")).toBeInTheDocument();
    });
  });

  it("应该渲染所有表单字段", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("打开模态框"));

    await waitFor(() => {
      expect(screen.getByLabelText("项目名称")).toBeInTheDocument();
      expect(screen.getByLabelText("项目描述")).toBeInTheDocument();
      expect(screen.getByText("状态")).toBeInTheDocument();
      expect(screen.getByText("优先级")).toBeInTheDocument();
      expect(screen.getByText("项目负责人")).toBeInTheDocument();
      expect(screen.getByText("团队成员")).toBeInTheDocument();
    });
  });

  it("项目名称为空时创建按钮应该禁用", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("打开模态框"));

    await waitFor(() => {
      const createButton = screen.getByRole("button", { name: "创建项目" });
      expect(createButton).toBeDisabled();
    });
  });

  it("输入项目名称后创建按钮应该启用", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("打开模态框"));

    await waitFor(() => {
      expect(screen.getByLabelText("项目名称")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("项目名称"), "新项目");

    await waitFor(() => {
      const createButton = screen.getByRole("button", { name: "创建项目" });
      expect(createButton).not.toBeDisabled();
    });
  });

  it("点击取消应该关闭模态框", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("打开模态框"));

    await waitFor(() => {
      expect(screen.getByText("创建新项目")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "取消" }));

    await waitFor(() => {
      expect(screen.queryByText("创建新项目")).not.toBeInTheDocument();
    });
  });

  it("提交表单应该调用 API 并显示成功提示", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("打开模态框"));

    await waitFor(() => {
      expect(screen.getByLabelText("项目名称")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("项目名称"), "测试项目");
    await user.type(screen.getByLabelText("项目描述"), "这是项目描述");

    await user.click(screen.getByRole("button", { name: "创建项目" }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/api/projects", {
        method: "POST",
        body: expect.stringContaining("测试项目"),
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("项目创建成功！");
    });
  });

  it("提交成功后应该关闭模态框并重置表单", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("打开模态框"));

    await waitFor(() => {
      expect(screen.getByLabelText("项目名称")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("项目名称"), "测试项目");
    await user.click(screen.getByRole("button", { name: "创建项目" }));

    await waitFor(() => {
      expect(screen.queryByText("创建新项目")).not.toBeInTheDocument();
    });

    // 重新打开检查表单是否重置
    await user.click(screen.getByText("打开模态框"));

    await waitFor(() => {
      expect(screen.getByLabelText("项目名称")).toHaveValue("");
    });
  });

  it("提交失败应该显示错误提示", async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error("创建失败"));

    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("打开模态框"));

    await waitFor(() => {
      expect(screen.getByLabelText("项目名称")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("项目名称"), "测试项目");
    await user.click(screen.getByRole("button", { name: "创建项目" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("创建失败");
    });
  });

  it("提交中应该显示加载状态", async () => {
    vi.mocked(apiFetch).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("打开模态框"));

    await waitFor(() => {
      expect(screen.getByLabelText("项目名称")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("项目名称"), "测试项目");
    await user.click(screen.getByRole("button", { name: "创建项目" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "创建中..." })).toBeDisabled();
    });
  });
});
