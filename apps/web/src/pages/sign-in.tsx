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

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async () => {
    // 表单校验
    if (!email.trim()) {
      toast.error("请输入邮箱地址");
      return;
    }
    if (!password) {
      toast.error("请输入密码");
      return;
    }

    setLoading(true);
    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/",
    });
    setLoading(false);

    if (error) {
      // 处理邮箱未验证的情况
      if (error.status === 403 || error.message?.includes("verify")) {
        toast.error("请先验证您的邮箱");
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      toast.error(error.message || "登录失败");
    } else {
      toast.success("登录成功！");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* 左侧配图占位 */}
      <div
        className="hidden lg:block relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login_image.webp')" }}
      >
        {/* 透明遮罩层，提升文字对比度或整体质感 */}
        <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
      </div>

      {/* 右侧登录表单 */}
      <div className="flex items-center justify-center relative overflow-hidden bg-[#91d5e4]">
        <Card className="w-full max-w-md border-none shadow-xl bg-white dark:bg-zinc-950 relative z-10 m-8">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">
              登录
            </CardTitle>
            <CardDescription className="text-base">
              欢迎回来！请输入您的账号信息。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">密码</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  忘记密码？
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 mt-2">
            <Button
              className="w-full"
              size="lg"
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? "登录中..." : "登录"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              还没有账号？{" "}
              <Link
                to="/sign-up"
                className="text-primary hover:underline font-medium"
              >
                快速注册
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
