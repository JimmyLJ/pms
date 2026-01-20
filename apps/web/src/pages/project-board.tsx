import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Zap,
  ListTodo,
  Calendar,
  Calendar as CalendarIcon,
  BarChart3,
  Settings,
  Square,
  Bug,
  Settings2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateTaskModal } from "@/components/kanban/create-task-modal";
import { ProjectAnalytics } from "@/components/analytics/project-analytics";
import { ProjectSettings } from "@/components/settings/project-settings";

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
  startDate?: string | null;
  endDate?: string | null;
  priority?: string | null;
  progress?: number | null;
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



const PRIORITY_MAP: Record<string, { label: string; className: string }> = {
  HIGH: { label: "高", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  MEDIUM: { label: "中", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  LOW: { label: "低", className: "bg-pink-100 text-pink-700 hover:bg-pink-100" },
};

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Zap }> = {
  FEATURE: { label: "功能", color: "text-green-500", icon: Zap },
  TASK: { label: "任务", color: "text-green-500", icon: Square },
  IMPROVEMENT: { label: "优化", color: "text-purple-500", icon: Settings2 },
  BUG: { label: "缺陷", color: "text-red-500", icon: Bug },
  OTHER: { label: "其他", color: "text-orange-500", icon: FileText },
};

// 日期格式化函数
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", { day: "numeric", month: "long" });
};

// 日历辅助函数
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const getCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  return days;
};

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long" });
};

const formatShortDate = (date: Date) => {
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
};

export default function ProjectBoardPage() {
  const { workspaceId, projectId } = useParams();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentTab = searchParams.get("tab") || "tasks";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  // 日历状态
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // 更新任务状态
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiFetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  const updateTaskStatus = (taskId: string, status: string) => {
    updateStatusMutation.mutate({ taskId, status });
  };

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

  // 日历相关计算
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const calendarDays = getCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth());

  // 获取某天的任务数量
  const getTaskCountForDay = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, date);
    }).length;
  };

  // 选中日期的任务
  const selectedDateTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    return isSameDay(taskDate, selectedDate);
  });

  // 即将到期的任务（3天内，包含今天）
  const upcomingTasks = tasks.filter((task) => {
    if (!task.dueDate || task.status === "DONE") return false;
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    return taskDate >= today && taskDate <= threeDaysLater;
  });

  // 已逾期的任务
  const overdueTasks = tasks.filter((task) => {
    if (!task.dueDate || task.status === "DONE") return false;
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  });

  // 月份导航
  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

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
      <Tabs value={currentTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <TabsList className="w-fit">
          <TabsTrigger value="tasks" className="gap-2 cursor-pointer">
            <ListTodo className="h-4 w-4" />
            任务
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2 cursor-pointer">
            <Calendar className="h-4 w-4" />
            日历
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 cursor-pointer">
            <BarChart3 className="h-4 w-4" />
            分析
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            设置
          </TabsTrigger>
        </TabsList>

        {/* 任务标签页 */}
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
                    <div className="h-3 w-3 rounded-full bg-gray-400" />
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
                        <div className="h-3 w-3 rounded-full bg-gray-400" />
                      </TableCell>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>
                        {task.type && TYPE_CONFIG[task.type] ? (() => {
                          const config = TYPE_CONFIG[task.type];
                          const Icon = config.icon;
                          return (
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${config.color}`} />
                              <span className={config.color}>{config.label}</span>
                            </div>
                          );
                        })() : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {task.priority && PRIORITY_MAP[task.priority] ? (
                          <Badge className={PRIORITY_MAP[task.priority].className}>
                            {PRIORITY_MAP[task.priority].label}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={task.status}
                          onValueChange={(value) => updateTaskStatus(task.id, value)}
                        >
                          <SelectTrigger className="w-[120px] h-8 border-0 bg-transparent hover:bg-gray-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TODO">待办</SelectItem>
                            <SelectItem value="IN_PROGRESS">进行中</SelectItem>
                            <SelectItem value="DONE">已完成</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={task.assignee.image || undefined} />
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                                {task.assignee.name?.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{task.assignee.name}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {task.dueDate ? (
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(task.dueDate)}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* 日历标签页 */}
        <TabsContent value="calendar" className="flex-1">
          <div className="flex gap-6 h-full">
            {/* 左侧：日历 + 选中日期任务 */}
            <div className="flex-1 flex flex-col gap-4">
              {/* 日历卡片 */}
              <Card className="p-6">
                {/* 日历头部 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">任务日历</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[120px] text-center">
                      {formatMonthYear(currentMonth)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 星期标题 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="text-center text-sm text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* 日期网格 */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="h-16" />;
                    }
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());
                    const taskCount = getTaskCountForDay(day);

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(date)}
                        className={`h-16 rounded-lg flex flex-col items-center justify-center transition-colors ${isSelected
                          ? "bg-blue-500 text-white"
                          : isToday
                            ? "bg-blue-50 text-blue-600"
                            : "hover:bg-gray-100"
                          }`}
                      >
                        <span className="text-sm font-medium">{day}</span>
                        {taskCount > 0 && (
                          <span className={`text-xs ${isSelected ? "text-blue-100" : "text-blue-500"}`}>
                            {taskCount}个任务
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* 选中日期的任务 */}
              <Card className="p-6 mb-4">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedDate.toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  的任务
                </h3>
                {selectedDateTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">该日期没有任务</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDateTasks.map((task) => {
                      // 根据优先级确定条形颜色（中等/默认默认为黄色/金色）
                      let barColor = "bg-yellow-400";
                      if (task.priority === 'HIGH') barColor = "bg-red-500";
                      if (task.priority === 'LOW') barColor = "bg-green-500";
                      if (task.priority === 'MEDIUM') barColor = "bg-yellow-400";

                      const typeConfig = task.type ? TYPE_CONFIG[task.type] : null;
                      let badgeClass = "bg-gray-100 text-gray-700";

                      if (typeConfig) {
                        if (typeConfig.color.includes("red")) badgeClass = "bg-red-100 text-red-700 hover:bg-red-100";
                        else if (typeConfig.color.includes("purple")) badgeClass = "bg-purple-100 text-purple-700 hover:bg-purple-100";
                        else if (typeConfig.color.includes("orange")) badgeClass = "bg-orange-100 text-orange-700 hover:bg-orange-100";
                        else badgeClass = "bg-green-100 text-green-700 hover:bg-green-100";
                      }

                      return (
                        <div
                          key={task.id}
                          className="flex items-stretch gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className={`w-1.5 shrink-0 rounded-full ${barColor}`} />
                          <div className="flex-1 flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                              <span className="text-lg font-semibold text-gray-900">{task.title}</span>
                              <span className="text-sm text-muted-foreground">
                                {task.priority && PRIORITY_MAP[task.priority]
                                  ? `${PRIORITY_MAP[task.priority].label}优先级`
                                  : ""}
                              </span>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              {typeConfig && (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs font-medium px-2 py-0.5 ${badgeClass}`}
                                >
                                  {typeConfig.label}
                                </Badge>
                              )}
                              {task.assignee && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{task.assignee.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* 右侧边栏 */}
            <div className="w-80 flex flex-col gap-4">
              {/* 即将到期 */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5" />
                  <h4 className="font-semibold text-base">即将到期</h4>
                </div>
                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">暂无即将到期的任务</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingTasks.map((task) => {
                      const typeConfig = task.type ? TYPE_CONFIG[task.type] : null;
                      let badgeClass = "bg-gray-100 text-gray-700";

                      if (typeConfig) {
                        if (typeConfig.color.includes("red")) badgeClass = "bg-red-100 text-red-700 hover:bg-red-100";
                        else if (typeConfig.color.includes("purple")) badgeClass = "bg-purple-100 text-purple-700 hover:bg-purple-100";
                        else if (typeConfig.color.includes("orange")) badgeClass = "bg-orange-100 text-orange-700 hover:bg-orange-100";
                        else badgeClass = "bg-green-100 text-green-700 hover:bg-green-100";
                      }

                      return (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex flex-col gap-1">
                            <p className="font-medium text-sm text-gray-900">{task.title}</p>
                            <p className="text-xs text-gray-500">
                              {task.dueDate && formatShortDate(new Date(task.dueDate))}
                            </p>
                          </div>
                          {typeConfig && (
                            <Badge
                              variant="secondary"
                              className={`text-xs font-medium px-2 py-0.5 ${badgeClass}`}
                            >
                              {typeConfig.label}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* 已逾期 */}
              <Card className={`p-4 border-l-4 border-l-red-500 shadow-sm mb-6 ${overdueTasks.length > 0 ? "border-red-100" : ""}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className={`h-5 w-5 ${overdueTasks.length > 0 ? "text-red-600" : "text-muted-foreground"}`} />
                  <h4 className={`font-semibold text-base ${overdueTasks.length > 0 ? "text-red-700" : ""}`}>
                    已逾期 ({overdueTasks.length})
                  </h4>
                </div>
                {overdueTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">暂无逾期任务</p>
                ) : (
                  <div className="space-y-3">
                    {overdueTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-sm text-gray-900">{task.title}</p>
                          <p className="text-xs text-red-600 font-medium">
                            截止于 {task.dueDate && formatShortDate(new Date(task.dueDate))}
                          </p>
                        </div>
                        {task.type && TYPE_CONFIG[task.type] && (
                          <Badge
                            variant="secondary"
                            className="text-xs font-medium px-2 py-0.5 bg-red-200 text-red-800 hover:bg-red-200"
                          >
                            {TYPE_CONFIG[task.type].label}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 分析标签页 */}
        <TabsContent value="analytics" className="flex-1 overflow-y-auto">
          <ProjectAnalytics tasks={tasks} project={project} isLoading={tasksLoading} />
        </TabsContent>

        {/* 设置标签页 */}
        <TabsContent value="settings" className="flex-1 overflow-y-auto">
          <ProjectSettings project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
