import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { apiFetch } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Folder, CheckCircle2, User, AlertTriangle, ArrowRight, Clock } from "lucide-react";

export default function DashboardPage() {
  const { workspaceId } = useParams();
  const { data: session } = authClient.useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", workspaceId],
    queryFn: () => apiFetch<{ data: { taskCounts: any[], recentTasks: any[] } }>(`/api/analytics/dashboard?workspaceId=${workspaceId}`).then(r => r.data),
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

  // Mock data for display mostly, as API doesn't return everything yet
  const stats = [
    {
      title: "项目总数",
      value: "0",
      description: `在 ${session?.session.activeOrganizationId ? "测试组织1" : "当前组织"}`,
      icon: Folder,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10"
    },
    {
      title: "已完成项目",
      value: "0",
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

  const recentTasks = data?.recentTasks || [];

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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">项目概览</CardTitle>
              <Button variant="ghost" size="sm" className="text-sm text-muted-foreground gap-1">
                查看全部 <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="h-[300px] flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Folder className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-4">暂无项目</h3>
              <Button className="bg-blue-600 hover:bg-blue-700">创建您的第一个项目</Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">最近活动</CardTitle>
            </CardHeader>
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