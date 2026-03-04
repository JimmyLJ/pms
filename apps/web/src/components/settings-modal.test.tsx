import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { store } from "@/store";
import { SettingsModal } from "./settings-modal";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock authClient
const mockUseSession = vi.fn();
const mockUpdateUser = vi.fn();
const mockListSessions = vi.fn();
const mockChangePassword = vi.fn();
const mockChangeEmail = vi.fn();
const mockGetFullOrganization = vi.fn();
const mockOrganizationList = vi.fn();
const mockSetActive = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => mockUseSession(),
    updateUser: (data: any) => mockUpdateUser(data),
    listSessions: () => mockListSessions(),
    changePassword: (data: any) => mockChangePassword(data),
    changeEmail: (data: any) => mockChangeEmail(data),
    organization: {
      getFullOrganization: (params: any) => mockGetFullOrganization(params),
      list: () => mockOrganizationList(),
      setActive: (params: any) => mockSetActive(params),
    },
  },
}));

// Mock apiFetch
vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn(),
}));

// Mock ImageUpload
vi.mock("@/components/image-upload", () => ({
  ImageUpload: ({ onChange }: any) => (
    <button onClick={() => onChange("https://example.com/avatar.jpg")}>
      上传头像
    </button>
  ),
}));

import { apiFetch } from "@/lib/api-client";
import { toast } from "react-hot-toast";

const mockSession = {
  user: {
    id: "user-1",
    name: "测试用户",
    email: "test@example.com",
    image: null,
  },
  session: {
    id: "session-1",
    activeOrganizationId: "workspace-1",
  },
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderSettingsModal(open = true) {
  const onOpenChange = vi.fn();
  const queryClient = createTestQueryClient();

  const result = render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/w/workspace-1"]}>
          <Routes>
            <Route
              path="/w/:workspaceId"
              element={
                <SettingsModal open={open} onOpenChange={onOpenChange} />
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );

  return { ...result, onOpenChange };
}

describe("SettingsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: mockSession,
      isPending: false,
    });
    mockListSessions.mockResolvedValue({ data: [] });
    mockGetFullOrganization.mockResolvedValue({
      data: {
        id: "workspace-1",
        name: "我的工作区",
        slug: "my-workspace",
        logo: null,
        members: [{ userId: "user-1", role: "owner" }],
      },
    });
    vi.mocked(apiFetch).mockResolvedValue({
      data: {
        organization: { id: "workspace-1", name: "我的工作区" },
        stats: { members: 3, projects: 5, tasks: 12 },
      },
    });
  });

  // ==================== 基本渲染 ====================

  describe("基本渲染", () => {
    it("打开时应该显示设置标题", () => {
      renderSettingsModal();

      expect(screen.getByText("设置")).toBeInTheDocument();
      expect(screen.getByText("管理账号和工作区设置")).toBeInTheDocument();
    });

    it("应该显示三个 Tab", () => {
      renderSettingsModal();

      // '个人资料' appears in both sidebar tab and content area
      expect(screen.getAllByText("个人资料").length).toBeGreaterThan(0);
      expect(screen.getByText("安全")).toBeInTheDocument();
      expect(screen.getByText("工作区")).toBeInTheDocument();
    });

    it("默认应该显示个人资料 Tab", () => {
      renderSettingsModal();

      expect(screen.getByText("个人资料详情")).toBeInTheDocument();
    });

    it("未打开时不应该渲染内容", () => {
      renderSettingsModal(false);

      // Dialog 关闭时内容不可见
      expect(screen.queryByText("设置")).not.toBeInTheDocument();
    });
  });

  // ==================== 个人资料 Tab ====================

  describe("个人资料 Tab", () => {
    it("应该显示用户名和邮箱", () => {
      renderSettingsModal();

      expect(screen.getByText("测试用户")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    it("点击更新资料应该显示编辑表单", async () => {
      const user = userEvent.setup();
      renderSettingsModal();

      await user.click(screen.getByText("更新资料"));

      await waitFor(() => {
        expect(screen.getByText("姓名")).toBeInTheDocument();
        expect(screen.getByText("保存")).toBeInTheDocument();
        expect(screen.getByText("取消")).toBeInTheDocument();
      });
    });

    it("点击取消应该关闭编辑表单", async () => {
      const user = userEvent.setup();
      renderSettingsModal();

      await user.click(screen.getByText("更新资料"));

      await waitFor(() => {
        expect(screen.getByText("保存")).toBeInTheDocument();
      });

      await user.click(screen.getByText("取消"));

      await waitFor(() => {
        expect(screen.queryByText("保存")).not.toBeInTheDocument();
      });
    });

    it("保存个人资料应该调用 updateUser", async () => {
      mockUpdateUser.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      renderSettingsModal();

      await user.click(screen.getByText("更新资料"));

      await waitFor(() => {
        expect(screen.getByDisplayValue("测试用户")).toBeInTheDocument();
      });

      // 清空并输入新名字
      const nameInput = screen.getByDisplayValue("测试用户");
      await user.clear(nameInput);
      await user.type(nameInput, "新名字");

      await user.click(screen.getByText("保存"));

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith(
          expect.objectContaining({ name: "新名字" }),
        );
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("个人资料已更新");
      });
    });

    it("保存失败应该显示错误提示", async () => {
      mockUpdateUser.mockResolvedValue({
        error: { message: "更新失败" },
      });
      const user = userEvent.setup();
      renderSettingsModal();

      await user.click(screen.getByText("更新资料"));
      await waitFor(() => {
        expect(screen.getByText("保存")).toBeInTheDocument();
      });

      await user.click(screen.getByText("保存"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("更新失败");
      });
    });

    it("点击修改邮箱应该显示邮箱编辑表单", async () => {
      const user = userEvent.setup();
      renderSettingsModal();

      await user.click(screen.getByText("修改邮箱"));

      await waitFor(() => {
        expect(screen.getByText("修改邮箱地址")).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("输入您的新邮箱地址"),
        ).toBeInTheDocument();
      });
    });
  });

  // ==================== 安全 Tab ====================

  describe("安全 Tab", () => {
    it("切换到安全 Tab 应该显示安全内容", async () => {
      const user = userEvent.setup();
      renderSettingsModal();

      await user.click(screen.getByText("安全"));

      await waitFor(() => {
        expect(screen.getByText("密码")).toBeInTheDocument();
        expect(screen.getByText("活动设备")).toBeInTheDocument();
      });
    });

    it("点击设置密码应该显示密码修改表单", async () => {
      const user = userEvent.setup();
      renderSettingsModal();

      await user.click(screen.getByText("安全"));

      await waitFor(() => {
        expect(screen.getByText("设置密码")).toBeInTheDocument();
      });

      await user.click(screen.getByText("设置密码"));

      await waitFor(() => {
        expect(screen.getByText("设置新密码")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("输入当前密码")).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("输入新密码（至少 8 位）"),
        ).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText("再次输入新密码"),
        ).toBeInTheDocument();
      });
    });

    it("切换到安全 Tab 应该加载 sessions", async () => {
      mockListSessions.mockResolvedValue({
        data: [
          {
            id: "session-1",
            userAgent: "Mozilla/5.0 Chrome/120",
            ipAddress: "127.0.0.1",
            createdAt: new Date().toISOString(),
          },
        ],
      });

      const user = userEvent.setup();
      renderSettingsModal();

      await user.click(screen.getByText("安全"));

      await waitFor(() => {
        expect(mockListSessions).toHaveBeenCalled();
      });
    });
  });

  // ==================== 工作区 Tab ====================

  describe("工作区 Tab", () => {
    it("切换到工作区 Tab 应该显示工作区设置", async () => {
      const user = userEvent.setup();
      renderSettingsModal();

      await user.click(screen.getByText("工作区"));

      await waitFor(() => {
        expect(screen.getByText("工作区设置")).toBeInTheDocument();
        expect(screen.getByText("基本信息")).toBeInTheDocument();
        expect(screen.getByText("统计数据")).toBeInTheDocument();
      });
    });

    it("owner 应该能看到危险操作区域", async () => {
      const user = userEvent.setup();
      renderSettingsModal();

      await user.click(screen.getByText("工作区"));

      await waitFor(() => {
        expect(screen.getByText("危险操作")).toBeInTheDocument();
        expect(screen.getByText("删除工作区")).toBeInTheDocument();
      });
    });

    it("非 owner 不应该看到危险操作区域", async () => {
      mockGetFullOrganization.mockResolvedValue({
        data: {
          id: "workspace-1",
          name: "我的工作区",
          slug: "my-workspace",
          logo: null,
          members: [
            { userId: "user-1", role: "member" }, // 普通成员
          ],
        },
      });

      const user = userEvent.setup();
      renderSettingsModal();

      await user.click(screen.getByText("工作区"));

      await waitFor(() => {
        expect(screen.getByText("工作区设置")).toBeInTheDocument();
      });

      // 应该显示非 owner 的提示
      await waitFor(() => {
        expect(
          screen.getByText("只有工作区所有者可以修改工作区设置"),
        ).toBeInTheDocument();
      });

      expect(screen.queryByText("危险操作")).not.toBeInTheDocument();
    });

    it("删除按钮在未输入确认名称时应该禁用", async () => {
      const user = userEvent.setup();
      renderSettingsModal();

      await user.click(screen.getByText("工作区"));

      await waitFor(() => {
        expect(screen.getByText("确认删除工作区")).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", {
        name: /确认删除工作区/,
      });
      expect(deleteButton).toBeDisabled();
    });
  });

  // ==================== Tab 切换行为 ====================

  describe("Tab 切换", () => {
    it("切换 Tab 时应该重置状态", async () => {
      const user = userEvent.setup();
      renderSettingsModal();

      // 进入安全 Tab 并打开密码编辑
      await user.click(screen.getByText("安全"));
      await waitFor(() => {
        expect(screen.getByText("设置密码")).toBeInTheDocument();
      });
      await user.click(screen.getByText("设置密码"));

      await waitFor(() => {
        expect(screen.getByText("设置新密码")).toBeInTheDocument();
      });

      // 切换回个人资料 Tab
      await user.click(screen.getByText("个人资料"));

      // 再切换回安全 Tab，密码编辑应该被重置
      await user.click(screen.getByText("安全"));

      await waitFor(() => {
        expect(screen.getByText("设置密码")).toBeInTheDocument();
        expect(screen.queryByText("设置新密码")).not.toBeInTheDocument();
      });
    });
  });
});
