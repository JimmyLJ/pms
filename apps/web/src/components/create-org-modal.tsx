import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function CreateOrganizationModal({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCreate = async () => {
    if (!name || !slug) return;
    setLoading(true);
    const { error } = await authClient.organization.create({
      name,
      slug,
    });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      setOpen(false);
      setName("");
      setSlug("");
      // Better-Auth 会自动更新 session 中的 activeOrganization
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Workspaces are where your team manages projects and tasks.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              placeholder="Acme Corp"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                // 自动生成简单的 slug
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Workspace Slug</Label>
            <Input
              id="slug"
              placeholder="acme-corp"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
