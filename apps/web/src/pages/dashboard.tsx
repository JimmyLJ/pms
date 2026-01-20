import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Folder, CheckCircle2, User, AlertTriangle, ArrowRight, Clock, Users, Calendar, Zap, CheckSquare, Bug } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CreateProjectModal } from "@/components/create-project-modal";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  progress: number | null;
  createdAt: string;
  dueDate: string | null;
  memberCount?: number;
}

interface Task {
  id: string;
  title: string;
  type?: string;
  status?: string;
  dueDate?: string;
  createdAt: string;
  assignee?: {
    name?: string;
    image?: string;
  };
}

interface DashboardData {
  counts: {
    totalProjects: number;
    completedProjects: number;
    globalOverdue: number;
    myTasks: number;
    taskStatusCounts: Array<{ status: string; count: number }>;
  };
  lists: {
    recentProjects: Project[];
    recentActivity: Task[];
    myStats: {
      inProgress: Task[];
      overdue: Task[];
      recent: Task[];
    };
  };
}

const statusLabels: Record<string, string> = {
  planning: "规划中",
  active: "进行中",
  completed: "已完成",
  on_hold: "暂停",
  cancelled: "已取消",
};

const statusStyles: Record<string, string> = {
  planning: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  on_hold: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
};



const progressBarStyles: Record<string, string> = {
  planning: "bg-yellow-300",
  active: "bg-yellow-300",
  completed: "bg-cyan-300",
  on_hold: "bg-amber-300",
  cancelled: "bg-rose-300",
};





export default function DashboardPage() {
  const { workspaceId } = useParams();
  const { data: session } = authClient.useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", workspaceId],
    queryFn: () => apiFetch<{ data: DashboardData }>(`/api/analytics/dashboard?workspaceId=${workspaceId}`).then(r => r.data),
    enabled: !!workspaceId
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  const { counts, lists } = data || {
    counts: { totalProjects: 0, completedProjects: 0, globalOverdue: 0, myTasks: 0, taskStatusCounts: [] },
    lists: { recentProjects: [], recentActivity: [], myStats: { inProgress: [], overdue: [], recent: [] } }
  };

  const stats = [
    {
      title: "项目总数",
      value: String(counts.totalProjects),
      description: "在当前工作区",
      icon: Folder,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10"
    },
    {
      title: "已完成项目",
      value: String(counts.completedProjects),
      description: "占总数",
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-500/10"
    },
    {
      title: "我的任务",
      value: String(counts.myTasks),
      description: "分配给我",
      icon: User,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-500/10"
    },
    {
      title: "逾期任务",
      value: String(counts.globalOverdue),
      description: "全局逾期", // 指明是全局的
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-500/10"
    }
  ];

  const MiniTaskList = ({ tasks, emptyMessage }: { tasks: any[], emptyMessage: string }) => {
    if (!tasks || tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      )
    }
    return (
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center justify-between text-sm p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer group">
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate group-hover:text-primary transition-colors">{task.title}</span>
              {task.dueDate && <span className="text-[10px] text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</span>}
            </div>
            {/* Show minimal status dot if needed, or rely on section context */}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">欢迎回来, {session?.user.name?.split(' ')[1] || session?.user.name || "User"}</h2>
        <p className="text-muted-foreground mt-1">这是所有项目的今日动态</p>
      </div>

      {/* 统计网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-sm">
            <CardContent className="p-6 flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-4xl font-bold mt-2">{stat.value}</h3>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 左侧栏（主要） */}
        <div className="md:col-span-2 space-y-8">
          {/* 项目概览 */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-4 pb-4">
              <CardTitle className="text-lg font-medium">项目概览</CardTitle>
              <Link to={`/w/${workspaceId}/projects`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                查看全部 <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <Separator />
            {lists.recentProjects.length > 0 ? (
              <CardContent className="pt-0 divide-y">
                {lists.recentProjects.map((project: Project) => {
                  const normalizedStatus = (project.status || "planning").toLowerCase().replace(/\s+/g, "_");
                  const statusLabel = statusLabels[normalizedStatus] || statusLabels.planning;
                  const statusStyle = statusStyles[normalizedStatus] || statusStyles.planning;

                  const progressBarStyle = progressBarStyles[normalizedStatus] || progressBarStyles.planning;
                  const progressValue = Math.max(0, Math.min(100, Number(project.progress ?? 0)));
                  const memberCount = project.memberCount ?? 1;
                  const dueDate = project.dueDate
                    ? new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <Link
                      key={project.id}
                      to={`/w/${workspaceId}/projects/${project.id}`}
                      className="block py-5 last:pb-0 hover:bg-muted/30 transition-colors -mx-6 px-6"
                    >
                      {/* 项目标题和状态 */}
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-base font-bold text-foreground">{project.name}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-sm", statusStyle)}>
                            {statusLabel}
                          </span>
                          <div className="h-2.5 w-2.5 rounded-full border-2 border-yellow-400 bg-transparent" />
                        </div>
                      </div>

                      {/* 项目描述 */}
                      <p className="text-sm text-muted-foreground mb-4">
                        {project.description || "暂无描述"}
                      </p>

                      {/* 成员数和日期 */}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>{memberCount} 成员</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{dueDate}</span>
                        </div>
                      </div>

                      {/* 进度条 */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>进度</span>
                          <span>{progressValue}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", progressBarStyle)}
                            style={{ width: `${Math.max(progressValue, 2)}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            ) : (
              <CardContent className="h-[200px] flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Folder className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground mb-4">暂无项目</h3>
                <CreateProjectModal>
                  <Button className="bg-blue-600 hover:bg-blue-700">创建您的第一个项目</Button>
                </CreateProjectModal>
              </CardContent>
            )}
          </Card>

          {/* 最近活动 */}
          <Card className="shadow-sm">
            <CardHeader className="pt-6 pb-4">
              <CardTitle className="text-lg font-medium">最近活动</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {lists.recentActivity.length > 0 ? (
                <div className="divide-y">
                  {lists.recentActivity.map((task: any) => {
                    // Determine Type Info
                    let TypeIcon = CheckSquare;
                    let typeColor = "text-green-600";
                    let typeBg = "bg-green-100";
                    let typeLabel = "任务";

                    const lowerType = (task.type || "task").toLowerCase();
                    if (lowerType === "feature") {
                      TypeIcon = Zap;
                      typeColor = "text-blue-600";
                      typeBg = "bg-blue-100";
                      typeLabel = "功能";
                    } else if (lowerType === "bug") {
                      TypeIcon = Bug;
                      typeColor = "text-red-600";
                      typeBg = "bg-red-100";
                      typeLabel = "缺陷";
                    }

                    // Determine Status Info
                    let statusLabel = "待办";
                    let statusBg = "bg-gray-200 text-gray-700";

                    const lowerStatus = (task.status || "todo").toLowerCase();
                    if (lowerStatus === "in_progress") {
                      statusLabel = "进行中";
                      statusBg = "bg-yellow-100 text-yellow-700";
                    } else if (lowerStatus === "done") {
                      statusLabel = "已完成";
                      statusBg = "bg-green-100 text-green-700";
                    } else if (lowerStatus === "backlog") {
                      statusLabel = "待办";
                    }

                    return (
                      <div key={task.id} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", typeBg)}>
                            <TypeIcon className={cn("h-5 w-5", typeColor)} />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium leading-none mb-2 mt-1">{task.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{typeLabel}</span>
                              <div className="flex items-center gap-1.5 ml-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={task.assignee?.image} />
                                  <AvatarFallback className="text-[9px]">{task.assignee?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span>{task.assignee?.name || "未分配"}</span>
                              </div>
                              <span className="ml-1 text-muted-foreground/60">{new Date(task.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                        <div className={cn("px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider", statusBg)}>
                          {statusLabel}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">暂无最近活动</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧栏（侧边栏） */}
        <div className="space-y-6">
          {/* 我的任务 */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">我的任务</CardTitle>
              </div>
              <span className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded text-xs font-medium">
                {lists.myStats.recent.length}
              </span>
            </CardHeader>
            <Separator />
            <CardContent className="pb-6 pt-4">
              <MiniTaskList tasks={lists.myStats.recent} emptyMessage="暂无任务" />
            </CardContent>
          </Card>

          {/* 逾期 */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">逾期</CardTitle>
              </div>
              <span className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded text-xs font-medium">
                {lists.myStats.overdue.length}
              </span>
            </CardHeader>
            <Separator />
            <CardContent className="pb-6 pt-4">
              <MiniTaskList tasks={lists.myStats.overdue} emptyMessage="无逾期任务" />
            </CardContent>
          </Card>

          {/* 进行中 */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">进行中</CardTitle>
              </div>
              <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
                {lists.myStats.inProgress.length}
              </span>
            </CardHeader>
            <Separator />
            <CardContent className="pb-6 pt-4">
              <MiniTaskList tasks={lists.myStats.inProgress} emptyMessage="无进行中任务" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
