import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api-client";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface AddProjectMemberModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProjectMemberModal({
  projectId,
  open,
  onOpenChange,
}: AddProjectMemberModalProps) {
  const queryClient = useQueryClient();
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

  // 获取候选成员（同组织但未在项目中的成员）
  const { data: candidates = [], isLoading } = useQuery<User[]>({
    queryKey: ["project-candidates", projectId],
    queryFn: async () => {
      const res = await apiFetch<{ data: User[] }>(`/api/projects/${projectId}/candidates`);
      return res.data;
    },
    enabled: open, // 打开弹窗时才加载
  });

  // 添加成员 Mutation
  const addMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiFetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      return userId;
    },
    onMutate: (userId) => {
      setAddingIds((prev) => new Set(prev).add(userId));
    },
    onSuccess: () => {
      toast.success("已添加成员");
      // 刷新项目成员列表
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      // 刷新候选列表
      queryClient.invalidateQueries({ queryKey: ["project-candidates", projectId] });
    },
    onError: () => {
      toast.error("添加失败，请重试");
    },
    onSettled: (userId) => {
      if (userId) {
        setAddingIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    },
  });

  const handleAdd = (userId: string) => {
    addMutation.mutate(userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            添加项目成员
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>没有可添加的成员</p>
              <p className="text-sm mt-1">该组织下的所有成员都已加入此项目</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {candidates.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 px-3 ml-2"
                    disabled={addingIds.has(user.id)}
                    onClick={() => handleAdd(user.id)}
                  >
                    {addingIds.has(user.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        添加
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
