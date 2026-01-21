import { useState, useEffect } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateProjectModal } from "@/components/create-project-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Plus, Folder, Search, ChevronDown, Loader2, MoreVertical, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
  createdAt: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  progress?: number | null;
}

interface ProjectsResponse {
  data: Project[];
  hasMore: boolean;
  nextCursor: string | null;
}

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "active", label: "进行中" },
  { value: "planning", label: "规划中" },
  { value: "completed", label: "已完成" },
  { value: "on_hold", label: "暂停" },
  { value: "cancelled", label: "已取消" },
];

const priorityOptions = [
  { value: "all", label: "全部优先级" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

const statusLabels: Record<string, string> = {
  planning: "规划中",
  active: "进行中",
  completed: "已完成",
  on_hold: "暂停",
  cancelled: "已取消",
};

const statusStyles: Record<string, string> = {
  planning: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  on_hold: "bg-amber-100 text-amber-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const priorityLabels: Record<string, string> = {
  low: "低优先级",
  medium: "中优先级",
  high: "高优先级",
};

export default function ProjectsPage() {
  const { workspaceId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // 删除项目相关状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const { ref, inView } = useInView();
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/projects?workspaceId=${workspaceId}&cursor=${pageParam}&limit=30`
        : `/api/projects?workspaceId=${workspaceId}&limit=30`;
      const res = await apiFetch<ProjectsResponse>(url);
      return res;
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!workspaceId,
    initialPageParam: null as string | null,
  });

  // 当滚动到底部时自动加载更多
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 删除项目 mutation
  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: async (projectId: string) => {
      return apiFetch(`/api/projects/${projectId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("项目已删除");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      setDeleteConfirmName("");
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["sidebar-projects"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "删除失败");
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete && deleteConfirmName === projectToDelete.name) {
      deleteProject(projectToDelete.id);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
    setDeleteConfirmName("");
  };

  if (error) return <div className="text-destructive">Error loading projects</div>;

  // 合并所有页面的数据
  const allProjects = data?.pages.flatMap(page => page.data) ?? [];

  const filteredProjects = allProjects.filter((project) => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      project.name.toLowerCase().includes(normalizedSearch);
    const normalizedStatus = (project.status || "planning")
      .toLowerCase()
      .replace(/\s+/g, "_");
    const normalizedPriority = (project.priority || "medium").toLowerCase();
    const matchesStatus =
      statusFilter === "all" || normalizedStatus === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || normalizedPriority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">项目</h2>
          <p className="text-muted-foreground">管理和跟踪您的项目</p>
        </div>
        <CreateProjectModal>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            新建项目
          </Button>
        </CreateProjectModal>
      </div>

      {/* 筛选区域 */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索项目..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-lg bg-background pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 min-w-[140px] justify-between rounded-lg">
              {statusOptions.find(o => o.value === statusFilter)?.label}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
              {statusOptions.map(option => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 min-w-[140px] justify-between rounded-lg">
              {priorityOptions.find(o => o.value === priorityFilter)?.label}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={priorityFilter} onValueChange={setPriorityFilter}>
              {priorityOptions.map(option => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-[180px] shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !filteredProjects || filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
            <Folder className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">暂无项目</h3>
          <p className="text-muted-foreground">创建您的第一个项目以开始使用</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const normalizedStatus = (project.status || "planning")
                .toLowerCase()
                .replace(/\s+/g, "_");
              const statusLabel = statusLabels[normalizedStatus] || statusLabels.planning;
              const statusStyle = statusStyles[normalizedStatus] || statusStyles.planning;
              const normalizedPriority = (project.priority || "medium").toLowerCase();
              const priorityLabel = priorityLabels[normalizedPriority] || priorityLabels.medium;
              const progressValue = Math.max(
                0,
                Math.min(100, Number(project.progress ?? 0))
              );

              return (
                <Link key={project.id} to={`/w/${workspaceId}/projects/${project.id}`}>
                  <Card className="group hover:border-primary transition-colors cursor-pointer h-full shadow-sm relative">
                    {/* 操作菜单 */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted"
                            onClick={(e) => e.preventDefault()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                            onClick={(e) => handleDeleteClick(e, project)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除项目
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardContent className="space-y-4 p-5">
                      <div className="space-y-1 pr-8">
                        <div className="text-base font-semibold">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.description || "暂无描述"}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide",
                            statusStyle
                          )}
                        >
                          {statusLabel}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {priorityLabel}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>进度</span>
                          <span>{progressValue}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${progressValue}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* 加载更多指示器 */}
          {hasNextPage && (
            <div ref={ref} className="flex justify-center py-6">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>加载中...</span>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">滚动加载更多</span>
              )}
            </div>
          )}
        </>
      )}

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={handleCloseDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              删除项目
            </DialogTitle>
            <DialogDescription>
              此操作不可撤销，请谨慎操作。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">
                删除项目「{projectToDelete?.name}」将同时删除所有相关的任务和成员关联。
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                请输入项目名称 <span className="font-semibold text-foreground">{projectToDelete?.name}</span> 以确认删除：
              </p>
              <Input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="输入项目名称"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={handleCloseDeleteDialog}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteConfirmName !== projectToDelete?.name || isDeleting}
              className="cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  删除中...
                </>
              ) : (
                "确认删除"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
