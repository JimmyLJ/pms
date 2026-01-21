import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
import { ImageUpload } from "@/components/image-upload";

interface CreateOrganizationModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateOrganizationModal({
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CreateOrganizationModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (isOpen: boolean) => {
    if (isControlled && setControlledOpen) {
      setControlledOpen(isOpen);
    } else {
      setInternalOpen(isOpen);
    }

    if (!isOpen) {
      setName("");
      setSlug("");
      setLogo(""); // Reset logo state
    }
  };

  const handleCreate = async () => {
    if (!name || !slug) return;
    setLoading(true);
    const { data, error } = await authClient.organization.create({
      name,
      slug,
      logo, // Pass logo to API
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "创建失败");
    } else if (data) {
      toast.success("工作区创建成功！");
      handleOpenChange(false);
      setName("");
      setSlug("");
      setLogo("");
      await authClient.organization.setActive({ organizationId: data.id });
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      navigate(`/w/${data.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建工作区</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Logo 上传区域 */}
          <div className="grid gap-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <ImageUpload
                value={logo}
                onChange={(url) => setLogo(url)}
              />
              <div>
                <p className="text-sm font-medium">
                  工作区图标
                </p>
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
