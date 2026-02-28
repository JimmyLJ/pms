import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, RotateCw } from "lucide-react";

const RESEND_COOLDOWN = 60; // 重新发送冷却时间（秒）

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!email) {
      toast.error("邮箱地址无效");
      return;
    }

    setSending(true);
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: window.location.origin,
      });
      toast.success("验证邮件已重新发送！");
      setCountdown(RESEND_COOLDOWN);
    } catch {
      toast.error("发送失败，请稍后重试");
    } finally {
      setSending(false);
    }
  };

  // 遮挡邮箱中间部分，如 li***20@qq.com
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

      {/* 右侧验证提示 */}
      <div className="flex items-center justify-center relative overflow-hidden bg-[#91d5e4]">
        <Card className="w-full max-w-md border-none shadow-xl bg-white dark:bg-zinc-950 relative z-10 m-8">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
              <Mail className="h-8 w-8 text-sky-500" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              请查收您的邮件
            </CardTitle>
            <CardDescription className="text-base">
              验证邮件已发送至{" "}
              <span className="font-medium text-foreground">{maskedEmail}</span>
              <br />
              请点击邮件中的链接完成邮箱验证。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 提示信息 */}
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
              <p>📮 邮件可能需要几分钟才能到达</p>
              <p>📂 如果没有收到，请检查垃圾邮件文件夹</p>
            </div>

            {/* 重新发送按钮 */}
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleResend}
              disabled={sending || countdown > 0}
            >
              <RotateCw
                className={`mr-2 h-4 w-4 ${sending ? "animate-spin" : ""}`}
              />
              {countdown > 0
                ? `${countdown} 秒后可重新发送`
                : sending
                  ? "发送中..."
                  : "重新发送验证邮件"}
            </Button>

            {/* 底部链接 */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                已完成验证？{" "}
                <Link
                  to="/sign-in"
                  className="text-primary hover:underline font-medium"
                >
                  前往登录
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                邮箱输入错误？{" "}
                <Link
                  to="/sign-up"
                  className="text-primary hover:underline font-medium"
                >
                  重新注册
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
