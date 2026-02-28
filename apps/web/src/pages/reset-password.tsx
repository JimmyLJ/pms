import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!token) {
      toast.error("无效的重置链接，请重新申请");
      return;
    }
    if (password.length < 8) {
      toast.error("密码至少需要 8 个字符");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || "重置失败，链接可能已过期，请重新申请");
    } else {
      setSuccess(true);
      // 3 秒后自动跳转到登录页
      setTimeout(() => navigate("/sign-in"), 3000);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* 左侧配图 */}
      <div
        className="hidden lg:block relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login_image.webp')" }}
      >
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
      </div>

      {/* 右侧内容 */}
      <div className="flex items-center justify-center relative overflow-hidden bg-[#91d5e4]">
        <Card className="w-full max-w-md border-none shadow-xl bg-white dark:bg-zinc-950 relative z-10 m-8">
          {!success ? (
            <>
              <CardHeader className="space-y-2">
                <CardTitle className="text-3xl font-bold tracking-tight">
                  设置新密码
                </CardTitle>
                <CardDescription className="text-base">
                  请输入您的新密码，密码至少需要 8 个字符。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="password">新密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="至少 8 个字符"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认密码</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="再次输入新密码"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    disabled={loading}
                  />
                </div>
                <Button
                  className="w-full mt-2"
                  size="lg"
                  onClick={handleReset}
                  disabled={loading}
                >
                  {loading ? "重置中..." : "重置密码"}
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">
                  密码重置成功
                </CardTitle>
                <CardDescription className="text-base">
                  您的密码已成功更新，3 秒后自动跳转到登录页面。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/sign-in">
                  <Button className="w-full" size="lg" variant="outline">
                    立即前往登录
                  </Button>
                </Link>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
