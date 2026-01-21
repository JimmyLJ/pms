import { useState } from "react";
import { CreateOrganizationModal } from "@/components/create-org-modal";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router-dom";

export default function OnboardingPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="text-center max-w-md w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter">欢迎使用 PMS</h1>
          <p className="text-muted-foreground">
            您还没有任何工作区。创建一个工作区以开始管理您的项目。
          </p>
        </div>

        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <Button
            size="lg"
            className="w-full"
            onClick={() => setIsModalOpen(true)}
          >
            创建第一个工作区
          </Button>
        </div>

        <Button
          variant="link"
          className="text-muted-foreground"
          onClick={async () => {
            await authClient.signOut();
            navigate("/sign-in");
          }}
        >
          退出登录
        </Button>
      </div>

      <CreateOrganizationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
