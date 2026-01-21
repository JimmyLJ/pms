import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api-client";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface AddMemberModalProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberModal({
  workspaceId,
  open,
  onOpenChange,
}: AddMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // 搜索用户
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await apiFetch<{ data: User[] }>(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}&workspaceId=${workspaceId}`
        );
        setSearchResults(res.data || []);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, workspaceId]);

  const handleAddMember = async (userId: string) => {
    setAddingUserId(userId);
    try {
      const res = await apiFetch<{ data?: any; error?: string }>(
        `/api/organizations/${workspaceId}/members`,
        {
          method: "POST",
          body: JSON.stringify({ userId, role: "member" }),
        }
      );

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success("成员添加成功");
      // 从搜索结果中移除已添加的用户
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      // 刷新成员列表
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
    } catch (error) {
      toast.error("添加失败，请重试");
    } finally {
      setAddingUserId(null);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            添加成员
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户（邮箱或姓名）..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* 搜索结果 */}
          <div className="min-h-[200px] max-h-[300px] overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                搜索中...
              </div>
            ) : searchQuery.trim().length < 2 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                请输入至少 2 个字符进行搜索
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                未找到匹配的用户
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddMember(user.id)}
                      disabled={addingUserId === user.id}
                      className="bg-blue-500 hover:bg-blue-600 cursor-pointer"
                    >
                      {addingUserId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "添加"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
