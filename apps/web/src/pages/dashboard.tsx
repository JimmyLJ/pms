import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Folder, CheckCircle2, User, AlertTriangle, ArrowRight, Clock, Users, Calendar } from "lucide-react";
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
    queryFn: () => apiFetch<{ data: { taskCounts: any[], recentTasks: any[], recentProjects: Project[] } }>(`/api/analytics/dashboard?workspaceId=${workspaceId}`).then(r => r.data),
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

  const recentProjects = data?.recentProjects || [];
  const recentTasks = data?.recentTasks || [];

  // 计算项目统计数据
  const totalProjects = recentProjects.length;
  const completedProjects = recentProjects.filter((p: Project) => p.status === "completed").length;

  // Mock data for stats (keep existing functionality)
  const stats = [
    {
      title: "项目总数",
      value: String(totalProjects),
      description: "在当前工作区",
      icon: Folder,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10"
    },
    {
      title: "已完成项目",
      value: String(completedProjects),
      description: "占总数",
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-500/10"
    },
    {
      title: "我的任务",
      value: "0",
      description: "分配给我",
      icon: User,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-500/10"
    },
    {
      title: "逾期",
      value: "0",
      description: "需要注意",
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-500/10"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">欢迎回来, {session?.user.name?.split(' ')[1] || session?.user.name || "User"}</h2>
        <p className="text-muted-foreground mt-1">这是所有项目的今日动态</p>
      </div>

      {/* Stats Grid */}
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
        {/* Left Column (Main) */}
        <div className="md:col-span-2 space-y-8">
          {/* Project Overview */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-4 pb-4">
              <CardTitle className="text-lg font-medium">项目概览</CardTitle>
              <Link to={`/w/${workspaceId}/projects`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                查看全部 <ArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <Separator />
            {recentProjects.length > 0 ? (
              <CardContent className="pt-0 divide-y">
                {recentProjects.map((project: Project) => {
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

          {/* Recent Activity */}
          <Card className="shadow-sm">
            <CardHeader className="pt-4 pb-4">
              <CardTitle className="text-lg font-medium">最近活动</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="min-h-[200px] flex flex-col items-center justify-center">
              {recentTasks.length > 0 ? (
                <div className="w-full space-y-4">
                  {recentTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between border-b pb-2 last:border-0 text-left w-full">
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.status}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">暂无最近活动</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          {/* My Tasks */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">我的任务</CardTitle>
              </div>
              <span className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded text-xs font-medium">0</span>
            </CardHeader>
            <Separator />
            <CardContent className="pb-6 pt-2">
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-sm text-muted-foreground">暂无任务</p>
              </div>
            </CardContent>
          </Card>

          {/* Overdue */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">逾期</CardTitle>
              </div>
              <span className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded text-xs font-medium">0</span>
            </CardHeader>
            <Separator />
            <CardContent className="pb-6 pt-2">
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-sm text-muted-foreground">无逾期任务</p>
              </div>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">进行中</CardTitle>
              </div>
              <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-medium">0</span>
            </CardHeader>
            <Separator />
            <CardContent className="pb-6 pt-2">
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <p className="text-sm text-muted-foreground">无进行中任务</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
