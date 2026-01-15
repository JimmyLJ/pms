import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Zap,
  ListTodo,
  Calendar,
  BarChart3,
  Settings,
} from "lucide-react";

import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateTaskModal } from "@/components/kanban/create-task-modal";

interface ProjectMember {
  id: string;
  name: string;
  image: string | null;
}

interface Project {
  id: string;
  name: string;
  status: string | null;
  description: string | null;
  members?: ProjectMember[];
}

interface Task {
  id: string;
  title: string;
  type: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null;
  assigneeId: string | null;
  assignee?: {
    id: string;
    name: string;
    image: string | null;
  } | null;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  planning: { label: "规划中", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
  active: { label: "进行中", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  completed: { label: "已完成", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  on_hold: { label: "已暂停", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  cancelled: { label: "已取消", className: "bg-red-100 text-red-800 hover:bg-red-100" },
};

const TASK_STATUS_MAP: Record<string, { label: string; color: string }> = {
  TODO: { label: "待办", color: "text-gray-600" },
  IN_PROGRESS: { label: "进行中", color: "text-orange-600" },
  DONE: { label: "已完成", color: "text-green-600" },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  HIGH: { label: "高", color: "text-red-600" },
  MEDIUM: { label: "中", color: "text-yellow-600" },
  LOW: { label: "低", color: "text-green-600" },
};

const TYPE_MAP: Record<string, string> = {
  TASK: "任务",
  BUG: "缺陷",
  FEATURE: "功能",
  IMPROVEMENT: "优化",
  OTHER: "其他",
};

export default function ProjectBoardPage() {
  const { workspaceId, projectId } = useParams();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  // 获取项目信息
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () =>
      apiFetch<{ data: Project }>(`/api/projects/${projectId}`).then(
        (r) => r.data
      ),
    enabled: !!projectId,
  });

  // 获取任务列表
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () =>
      apiFetch<{ data: Task[] }>(`/api/tasks?projectId=${projectId}`).then(
        (r) => r.data
      ),
    enabled: !!projectId,
  });

  // 统计数据
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const teamMembers = project?.members?.length || 0;

  // 筛选任务
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (typeFilter !== "all" && task.type !== typeFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (assigneeFilter !== "all" && task.assignee?.id !== assigneeFilter) return false;
    return true;
  });

  const projectStatus = (project?.status || "planning").toLowerCase();
  const statusInfo = STATUS_MAP[projectStatus] || STATUS_MAP.planning;

  if (projectLoading) {
    return (
      <div className="h-full flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* 顶部栏 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to={`/w/${workspaceId}/projects`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">
            {project?.name || "Project"}
          </h2>
          <Badge className={statusInfo.className} variant="secondary">
            {statusInfo.label}
          </Badge>
        </div>

        {projectId && workspaceId && (
          <CreateTaskModal projectId={projectId} workspaceId={workspaceId} />
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">任务总数</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </div>
              <Zap className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">已完成</p>
                <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
              </div>
              <Zap className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">进行中</p>
                <p className="text-2xl font-bold text-orange-600">{inProgressTasks}</p>
              </div>
              <Zap className="h-4 w-4 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">团队成员</p>
                <p className="text-2xl font-bold text-blue-600">{teamMembers}</p>
              </div>
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 导航 */}
      <Tabs defaultValue="tasks" className="flex-1 flex flex-col">
        <TabsList className="w-fit">
          <TabsTrigger value="tasks" className="gap-2">
            <ListTodo className="h-4 w-4" />
            任务
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            日历
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            分析
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            设置
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="flex-1 flex flex-col space-y-4">
          {/* 筛选器 */}
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="TODO">待办</SelectItem>
                <SelectItem value="IN_PROGRESS">进行中</SelectItem>
                <SelectItem value="DONE">已完成</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="全部类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="TASK">任务</SelectItem>
                <SelectItem value="BUG">缺陷</SelectItem>
                <SelectItem value="FEATURE">功能</SelectItem>
                <SelectItem value="IMPROVEMENT">优化</SelectItem>
                <SelectItem value="OTHER">其他</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="全部优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                <SelectItem value="LOW">低</SelectItem>
                <SelectItem value="MEDIUM">中</SelectItem>
                <SelectItem value="HIGH">高</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="全部负责人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部负责人</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 任务表格 */}
          <Card className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                  </TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>截止日期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasksLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Skeleton className="h-4 w-48 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      没有找到符合筛选条件的任务
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                      </TableCell>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{task.type ? TYPE_MAP[task.type] || task.type : "-"}</TableCell>
                      <TableCell>
                        {task.priority ? (
                          <span className={PRIORITY_MAP[task.priority]?.color}>
                            {PRIORITY_MAP[task.priority]?.label || task.priority}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={TASK_STATUS_MAP[task.status]?.color}>
                          {TASK_STATUS_MAP[task.status]?.label || task.status}
                        </span>
                      </TableCell>
                      <TableCell>{task.assignee?.name || "-"}</TableCell>
                      <TableCell>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="flex-1">
          <Card className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">日历视图即将推出...</p>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="flex-1">
          <Card className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">分析视图即将推出...</p>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-1">
          <Card className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">项目设置即将推出...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
