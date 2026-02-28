import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    // 基本表单验证
    if (!name.trim()) {
      toast.error("请输入您的姓名");
      return;
    }
    if (!email.trim()) {
      toast.error("请输入邮箱地址");
      return;
    }
    if (password.length < 8) {
      toast.error("密码至少需要 8 个字符");
      return;
    }

    setLoading(true);
    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: window.location.origin,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "注册失败");
    } else {
      toast.success("注册成功！请查收验证邮件。");
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
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

      {/* 右侧注册表单 */}
      <div className="flex items-center justify-center relative overflow-hidden bg-[#91d5e4]">
        <Card className="w-full max-w-md border-none shadow-xl bg-white dark:bg-zinc-950 relative z-10 m-8">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">
              创建账号
            </CardTitle>
            <CardDescription className="text-base">
              欢迎加入！输入您的详细信息以开始使用。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                placeholder="请输入您的姓名"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少 8 个字符"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 mt-2">
            <Button
              className="w-full"
              size="lg"
              onClick={handleSignUp}
              disabled={loading}
            >
              {loading ? "创建中..." : "立即注册"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              已经有账号？{" "}
              <Link
                to="/sign-in"
                className="text-primary hover:underline font-medium"
              >
                返回登录
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
