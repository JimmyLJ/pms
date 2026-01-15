import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { authClient } from "@/lib/auth-client";
import { toast } from "react-hot-toast";
import { Upload } from "lucide-react";

export function CreateOrganizationModal({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name || !slug) return;
    setLoading(true);
    const { data, error } = await authClient.organization.create({
      name,
      slug,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else if (data) {
      toast.success("工作区创建成功！");
      setOpen(false);
      setName("");
      setSlug("");
      await authClient.organization.setActive({ organizationId: data.id });
      navigate(`/w/${data.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setName("");
        setSlug("");
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建工作区</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Logo 上传区域 */}
          <div className="grid gap-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 border-2 border-dashed rounded-lg text-muted-foreground">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <Button variant="outline" size="sm" disabled>
                  上传
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  推荐尺寸 1:1，最大 10MB
                </p>
              </div>
            </div>
          </div>

          {/* 名称输入 */}
          <div className="grid gap-2">
            <Label htmlFor="name">名称</Label>
            <Input
              id="name"
              placeholder="工作区名称"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
              }}
            />
          </div>

          {/* 标识输入 */}
          <div className="grid gap-2">
            <Label htmlFor="slug">唯一标识</Label>
            <Input
              id="slug"
              placeholder="my-workspace"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleCreate}
            disabled={loading || !name.trim() || !slug.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? "创建中..." : "创建工作区"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
