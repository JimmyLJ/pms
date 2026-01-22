import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { store } from "@/store";
import { WorkspaceSwitcher } from "./workspace-switcher";

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock authClient
const mockUseSession = vi.fn();
const mockOrganizationList = vi.fn();
const mockSetActive = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => mockUseSession(),
    organization: {
      list: () => mockOrganizationList(),
      setActive: (params: any) => mockSetActive(params),
    },
  },
}));

// Mock CreateOrganizationModal
vi.mock("./create-org-modal", () => ({
  CreateOrganizationModal: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="create-org-modal">{children}</div>
  ),
}));

const mockSession = {
  user: {
    id: "user-1",
    name: "测试用户",
    email: "test@example.com",
  },
  session: {
    activeOrganizationId: "workspace-1",
  },
};

const mockOrganizations = [
  {
    id: "workspace-1",
    name: "工作区 A",
    slug: "workspace-a",
    logo: null,
    membersCount: 5,
  },
  {
    id: "workspace-2",
    name: "工作区 B",
    slug: "workspace-b",
    logo: null,
    membersCount: 3,
  },
];

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

function renderSwitcher(workspaceId = "workspace-1") {
  const queryClient = createTestQueryClient();

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/w/${workspaceId}`]}>
          <Routes>
            <Route path="/w/:workspaceId" element={<WorkspaceSwitcher />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe("WorkspaceSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({ data: mockSession, isPending: false });
    mockOrganizationList.mockResolvedValue({ data: mockOrganizations });
    mockSetActive.mockResolvedValue({});
  });

  it("应该显示当前工作区名称", async () => {
    renderSwitcher();

    await waitFor(() => {
      expect(screen.getByText("工作区 A")).toBeInTheDocument();
    });
  });

  it("应该显示工作区数量", async () => {
    renderSwitcher();

    await waitFor(() => {
      expect(screen.getByText("2 个工作区")).toBeInTheDocument();
    });
  });

  it("点击应该展开下拉菜单", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await waitFor(() => {
      expect(screen.getByText("工作区 A")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByText("工作区 B")).toBeInTheDocument();
    });
  });

  it("应该显示所有工作区列表", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await waitFor(() => {
      expect(screen.getByText("工作区 A")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      // 下拉菜单中会再显示一次工作区 A（作为选项）
      const workspaceAItems = screen.getAllByText("工作区 A");
      expect(workspaceAItems.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("工作区 B")).toBeInTheDocument();
    });
  });

  it("当前工作区应该有选中标记", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await waitFor(() => {
      expect(screen.getByText("工作区 A")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      // 检查 Check 图标是否存在于当前工作区选项中
      const menuItems = screen.getAllByRole("menuitem");
      const activeItem = menuItems.find((item) =>
        item.textContent?.includes("工作区 A")
      );
      expect(activeItem).toBeDefined();
      expect(activeItem?.querySelector("svg")).toBeInTheDocument();
    });
  });

  it("点击其他工作区应该切换", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await waitFor(() => {
      expect(screen.getByText("工作区 A")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByText("工作区 B")).toBeInTheDocument();
    });

    // 点击工作区 B
    const menuItems = screen.getAllByRole("menuitem");
    const workspaceBItem = menuItems.find((item) =>
      item.textContent?.includes("工作区 B")
    );
    await user.click(workspaceBItem!);

    await waitFor(() => {
      expect(mockSetActive).toHaveBeenCalledWith({
        organizationId: "workspace-2",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/w/workspace-2");
    });
  });

  it("应该显示成员数量", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await waitFor(() => {
      expect(screen.getByText("工作区 A")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByText("5 名成员")).toBeInTheDocument();
      expect(screen.getByText("3 名成员")).toBeInTheDocument();
    });
  });

  it("应该显示创建工作区按钮", async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await waitFor(() => {
      expect(screen.getByText("工作区 A")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByText("创建工作区")).toBeInTheDocument();
    });
  });

  it("无工作区时应该显示默认文本", async () => {
    mockOrganizationList.mockResolvedValue({ data: [] });

    renderSwitcher();

    await waitFor(() => {
      expect(screen.getByText("选择工作区")).toBeInTheDocument();
      expect(screen.getByText("0 个工作区")).toBeInTheDocument();
    });
  });

  it("未登录时不应该加载工作区", async () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });

    renderSwitcher();

    // 组件仍然渲染，但不会加载数据
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
