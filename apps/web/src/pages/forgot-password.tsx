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
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("请输入邮箱地址");
      return;
    }

    setLoading(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    // 无论成功或失败都显示"已发送"，防止邮箱枚举攻击
    setSent(true);
  };

  // 遮挡邮箱中间部分
  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, start, middle, end) => {
        return start + "*".repeat(Math.min(middle.length, 4)) + end;
      })
    : "";

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
          {!sent ? (
            <>
              <CardHeader className="space-y-2">
                <CardTitle className="text-3xl font-bold tracking-tight">
                  忘记密码
                </CardTitle>
                <CardDescription className="text-base">
                  输入您的注册邮箱，我们将发送密码重置链接。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "发送中..." : "发送重置链接"}
                </Button>
                <p className="text-sm text-center">
                  <Link
                    to="/sign-in"
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    返回登录
                  </Link>
                </p>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
                  <Mail className="h-8 w-8 text-sky-500" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">
                  请查收您的邮件
                </CardTitle>
                <CardDescription className="text-base">
                  如果{" "}
                  <span className="font-medium text-foreground">
                    {maskedEmail}
                  </span>{" "}
                  已注册， 您将收到一封包含密码重置链接的邮件。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
                  <p>📮 邮件可能需要几分钟才能到达</p>
                  <p>📂 如果没有收到，请检查垃圾邮件文件夹</p>
                </div>
                <div className="text-center space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => setSent(false)}
                  >
                    重新输入邮箱
                  </Button>
                  <p className="text-sm pt-2">
                    <Link
                      to="/sign-in"
                      className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      返回登录
                    </Link>
                  </p>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
