import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { apiFetch } from "@/lib/api-client";

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

interface ProjectSettingsProps {
  project: Project | undefined;
}

export function ProjectSettings({ project }: ProjectSettingsProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [priority, setPriority] = useState("MEDIUM");
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const queryClient = useQueryClient();

  const { mutate: updateProject, isPending } = useMutation({
    mutationFn: async (data: any) => {
      if (!project?.id) throw new Error("Missing project ID");
      return apiFetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("项目已保存");
      queryClient.invalidateQueries({ queryKey: ["project", project?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save project");
    },
  });

  const handleSave = () => {
    if (!project?.id) return;
    updateProject({
      name,
      description,
      status,
      priority,
      progress,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
    });
  };

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setStatus((project.status || "active").toLowerCase());
      setPriority((project.priority || "MEDIUM").toUpperCase());
      setProgress(project.progress || 0);
      setStartDate(project.startDate ? new Date(project.startDate) : undefined);
      setEndDate(project.endDate ? new Date(project.endDate) : undefined);
    }
  }, [project]);

  return (
    <div className="flex gap-6 h-full">
      {/* 项目详情 */}
      <Card className="flex-1">
        <CardContent className="p-6 space-y-6">
          <h3 className="text-lg font-semibold">项目详情</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">项目名称</Label>
              <Input
                id="projectName"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                className="min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">进行中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="on_hold">暂停</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>优先级</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">低</SelectItem>
                    <SelectItem value="MEDIUM">中</SelectItem>
                    <SelectItem value="HIGH">高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate ? format(startDate, "yyyy/MM/dd") : "选择日期"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      footer={
                        <>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 text-blue-500 hover:text-blue-600 hover:bg-transparent font-normal"
                            onClick={() => setStartDate(undefined)}
                          >
                            清除
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 text-blue-500 hover:text-blue-600 hover:bg-transparent font-normal"
                            onClick={() => setStartDate(new Date())}
                          >
                            今天
                          </Button>
                        </>
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>结束日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      {endDate ? format(endDate, "yyyy/MM/dd") : "选择日期"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      footer={
                        <>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 text-blue-500 hover:text-blue-600 hover:bg-transparent font-normal"
                            onClick={() => setEndDate(undefined)}
                          >
                            清除
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 text-blue-500 hover:text-blue-600 hover:bg-transparent font-normal"
                            onClick={() => setEndDate(new Date())}
                          >
                            今天
                          </Button>
                        </>
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between">
                <Label>进度: {progress}%</Label>
              </div>
              <Slider
                value={[progress]}
                max={100}
                step={1}
                onValueChange={(vals) => setProgress(vals[0])}
                className="w-full"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ? "保存中..." : <><SaveIcon className="mr-2 h-4 w-4" />保存更改</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 团队成员 */}
      <Card className="w-[400px]">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">
              团队成员 ({project?.members?.length || 0})
            </h3>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {project?.members?.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.image || undefined} />
                    <AvatarFallback>
                      {member.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{member.name}</span>
                </div>
                <div className="h-7 px-3 flex items-center text-xs font-semibold border rounded-md">
                  负责人
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
