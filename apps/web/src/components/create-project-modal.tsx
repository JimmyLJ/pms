import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api-client";
import { toast } from "react-hot-toast";

export function CreateProjectModal({ children }: { children: React.ReactNode }) {
  const { workspaceId } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planning");
  const [priority, setPriority] = useState("medium");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leadId, setLeadId] = useState<string | undefined>();
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => {
      const { data } = await authClient.organization.getFullOrganization({
        query: { organizationId: workspaceId },
      });
      return data;
    },
    enabled: !!workspaceId,
  });
  const members = membersData?.members ?? [];
  const memberOptions = members.map((member) => ({
    id: member.user.id,
    label: member.user.name || member.user.email || "未命名",
  }));
  const memberLabelMap = new Map(
    memberOptions.map((member) => [member.id, member.label])
  );
  const mergedMemberIds = leadId
    ? [leadId, ...selectedMemberIds.filter((id) => id !== leadId)]
    : selectedMemberIds;
  const selectedMembers = mergedMemberIds.map((id) => ({
    id,
    label: memberLabelMap.get(id) || "未知成员",
  }));
  const memberSummary = selectedMembers.length
    ? `已选择 ${selectedMembers.length} 人`
    : "添加团队成员";
  const handleMemberToggle = (memberId: string, isChecked: boolean) => {
    setSelectedMemberIds((prev) => {
      if (isChecked) {
        return Array.from(new Set([...prev, memberId]));
      }
      return prev.filter((id) => id !== memberId);
    });
  };
  const resetForm = () => {
    setName("");
    setDescription("");
    setStatus("planning");
    setPriority("medium");
    setStartDate("");
    setEndDate("");
    setLeadId(undefined);
    setSelectedMemberIds([]);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId) {
        throw new Error("缺少工作区信息");
      }
      const trimmedName = name.trim();
      const trimmedDescription = description.trim();
      const payload = {
        name: trimmedName,
        description: trimmedDescription || undefined,
        status,
        priority,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        leadId: leadId || undefined,
        memberIds: mergedMemberIds.length ? mergedMemberIds : undefined,
        workspaceId,
      };
      return apiFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["analytics", workspaceId] });
      setOpen(false);
      resetForm();
      toast.success("项目创建成功！");
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px] overflow-hidden p-0 sm:rounded-l-lg sm:rounded-r-2xl">
        <div className="grid max-h-[calc(100vh-4rem)] gap-6 overflow-y-auto p-8">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl">创建新项目</DialogTitle>
            <DialogDescription className="text-left">
              所在工作区：
              <span className="text-blue-600"> {workspaceId || "未选择"}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">项目名称</Label>
              <Input
                id="name"
                className="h-10"
                placeholder="请输入项目名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                className="min-h-[96px] resize-none"
                placeholder="请输入项目描述"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>状态</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">规划中</SelectItem>
                    <SelectItem value="active">进行中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="on_hold">暂停</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
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
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>开始日期</Label>
                <DatePicker value={startDate} onChange={setStartDate} />
              </div>
              <div className="grid gap-2">
                <Label>结束日期</Label>
                <DatePicker value={endDate} onChange={setEndDate} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>项目负责人</Label>
              <Select
                value={leadId ?? "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setLeadId(undefined);
                    return;
                  }
                  setLeadId(value);
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未指定负责人</SelectItem>
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
              <Label>团队成员</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 w-full justify-between"
                  >
                    <span
                      className={
                        selectedMembers.length
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {memberSummary}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 w-64 overflow-y-auto">
                  <DropdownMenuLabel>选择成员</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {membersLoading ? (
                    <DropdownMenuItem disabled>加载中...</DropdownMenuItem>
                  ) : memberOptions.length > 0 ? (
                    memberOptions.map((member) => {
                      const isLead = member.id === leadId;
                      const isChecked =
                        isLead || selectedMemberIds.includes(member.id);
                      return (
                        <DropdownMenuCheckboxItem
                          key={member.id}
                          checked={isChecked}
                          disabled={isLead}
                          onCheckedChange={(checked) => {
                            if (isLead) return;
                            handleMemberToggle(member.id, checked === true);
                          }}
                        >
                          {member.label}
                        </DropdownMenuCheckboxItem>
                      );
                    })
                  ) : (
                    <DropdownMenuItem disabled>暂无成员</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {selectedMembers.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedMembers.map((member) => (
                    <Badge key={member.id} variant="secondary">
                      {member.label}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (!name.trim() || !workspaceId) return;
                mutation.mutate();
              }}
              disabled={mutation.isPending || !name.trim() || !workspaceId}
            >
              {mutation.isPending ? "创建中..." : "创建项目"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
