import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api-client";
import { Calendar, Plus } from "lucide-react";
import { toast } from "react-hot-toast";

export function CreateTaskModal({ 
  projectId, 
  workspaceId, 
  initialStatus = "TODO" 
}: { 
  projectId: string; 
  workspaceId: string;
  initialStatus?: string;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("TASK");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("unassigned");
  const [status, setStatus] = useState(initialStatus);
  const [dueDate, setDueDate] = useState("");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: projectData, isLoading: membersLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () =>
      apiFetch<{
        data: { members?: { id: string; name: string | null }[] };
      }>(`/api/projects/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  });
  const memberOptions =
    projectData?.members?.map((member) => ({
      id: member.id,
      label: member.name || "未命名",
    })) ?? [];
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("TASK");
    setPriority("MEDIUM");
    setAssigneeId("unassigned");
    setStatus(initialStatus);
    setDueDate("");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      return apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ 
          title, 
          description, 
          projectId, 
          workspaceId, 
          status,
          type,
          priority,
          dueDate: dueDate || undefined,
          assigneeId: assigneeId === "unassigned" ? undefined : assigneeId,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      setOpen(false);
      resetForm();
      toast.success("任务创建成功！");
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          新建任务
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] gap-6 p-8">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">创建新任务</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              className="h-10"
              placeholder="任务标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              className="min-h-[110px] resize-none"
              placeholder="描述任务内容"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>类型</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUG">缺陷</SelectItem>
                  <SelectItem value="FEATURE">功能</SelectItem>
                  <SelectItem value="TASK">任务</SelectItem>
                  <SelectItem value="IMPROVEMENT">优化</SelectItem>
                  <SelectItem value="OTHER">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>优先级</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">低</SelectItem>
                  <SelectItem value="MEDIUM">中</SelectItem>
                  <SelectItem value="HIGH">高</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>负责人</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">未分配</SelectItem>
                  {membersLoading ? (
                    <SelectItem value="loading" disabled>
                      加载中...
                    </SelectItem>
                  ) : memberOptions.length > 0 ? (
                    memberOptions.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>
                      暂无成员
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>状态</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">待办</SelectItem>
                  <SelectItem value="IN_PROGRESS">进行中</SelectItem>
                  <SelectItem value="DONE">已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>截止日期</Label>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <DatePicker value={dueDate} onChange={setDueDate} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" className="h-10" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            className="h-10 bg-blue-600 hover:bg-blue-700"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !title.trim()}
          >
            {mutation.isPending ? "创建中..." : "创建任务"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
