import { useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

import { Skeleton } from "@/components/ui/skeleton";

interface ProjectAnalyticsProps {
  tasks: Task[];
  project: Project | undefined;
  isLoading: boolean;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const TYPE_LABELS: Record<string, string> = {
  FEATURE: "功能",
  TASK: "任务",
  IMPROVEMENT: "优化",
  BUG: "缺陷",
  OTHER: "其他",
};

export function ProjectAnalytics({ tasks, project, isLoading }: ProjectAnalyticsProps) {
  // 统计数据计算
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "DONE").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === "DONE") return false;
      return new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 状态分布
    const statusData = [
      { name: "待办", value: tasks.filter((t) => t.status === "TODO").length },
      { name: "进行中", value: inProgress },
      { name: "已完成", value: completed },
    ];

    // 类型分布
    const typeCount: Record<string, number> = {};
    tasks.forEach((t) => {
      const type = t.type || "OTHER";
      const label = TYPE_LABELS[type] || type;
      typeCount[label] = (typeCount[label] || 0) + 1;
    });
    const typeData = Object.entries(typeCount).map(([name, value]) => ({
      name,
      value,
    }));

    // 优先级分布
    const priorityCount = {
      HIGH: tasks.filter((t) => t.priority === "HIGH").length,
      MEDIUM: tasks.filter((t) => t.priority === "MEDIUM").length,
      LOW: tasks.filter((t) => t.priority === "LOW").length,
    };

    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate,
      statusData,
      typeData,
      priorityCount,
    };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-5">
        {/* Statistics Cards Skeleton */}
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Priority List Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-5">
      {/* 顶部统计卡片 Row 1 */}


      {/* 中部统计卡片 Row 2 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">完成率</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completionRate}%
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">进行中任务</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.inProgress}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">逾期任务</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.overdue}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">团队规模</p>
                <p className="text-2xl font-bold text-purple-600">
                  {project?.members?.length || 0}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表部分 */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">任务状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={stats.statusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#888" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#888" }}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    barSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">任务类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={stats.typeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {stats.typeData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

            </div>
          </CardContent>
        </Card>
      </div>

      {/* 优先级列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">任务优先级分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Low Priority */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-blue-500">→</span> 低
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{stats.priorityCount.LOW} 个任务</span>
                  <span className="text-muted-foreground bg-gray-100 px-2 py-0.5 rounded text-xs border">
                    {stats.total > 0 ? Math.round((stats.priorityCount.LOW / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${stats.total > 0 ? (stats.priorityCount.LOW / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Medium Priority */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-yellow-500">→</span> 中
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{stats.priorityCount.MEDIUM} 个任务</span>
                  <span className="text-muted-foreground bg-gray-100 px-2 py-0.5 rounded text-xs border">
                    {stats.total > 0 ? Math.round((stats.priorityCount.MEDIUM / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${stats.total > 0 ? (stats.priorityCount.MEDIUM / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* High Priority */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-red-500">→</span> 高
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{stats.priorityCount.HIGH} 个任务</span>
                  <span className="text-muted-foreground bg-gray-100 px-2 py-0.5 rounded text-xs border">
                    {stats.total > 0 ? Math.round((stats.priorityCount.HIGH / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${stats.total > 0 ? (stats.priorityCount.HIGH / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
