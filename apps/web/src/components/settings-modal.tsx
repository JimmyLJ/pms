import { useState, useEffect } from "react"
import { User, ShieldCheck, Laptop, Smartphone, Loader2 } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authClient } from "@/lib/auth-client"
import { toast } from "react-hot-toast"
import { ImageUpload } from "@/components/image-upload"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Tab = "profile" | "security"

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const { data: session } = authClient.useSession()

  const [name, setName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [editingEmail, setEditingEmail] = useState("")
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [newAvatarUrl, setNewAvatarUrl] = useState("")

  useEffect(() => {
    if (activeTab === "security") {
      const fetchSessions = async () => {
        setIsLoadingSessions(true)
        try {
          const res = await authClient.listSessions()
          if (res.data) {
            setActiveSessions(res.data)
          }
        } catch (e) {
          console.error(e)
        } finally {
          setIsLoadingSessions(false)
        }
      }
      fetchSessions()
    }
  }, [activeTab])



  const handleAvatarRemove = async () => {
    try {
      await authClient.updateUser({ image: null }) // or "" depending on API
      toast.success("Avatar removed")
    } catch (e) {
      toast.error("Failed to remove avatar")
    }
  }

  useEffect(() => {
    if (session?.user.name) {
      setName(session.user.name)
    }
  }, [session])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const fullName = name.trim()
      const { error } = await authClient.updateUser({
        name: fullName,
        image: newAvatarUrl || undefined, // Only update if new image is set
      })

      if (error) {
        toast.error(error.message || "更新失败")
      } else {
        toast.success("个人资料已更新")
        setIsEditingProfile(false)
        // 优化更新会话，或依赖 authClient 的重新获取
      }
    } catch (e) {
      toast.error("发生错误，请重试")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] p-0 gap-0 overflow-hidden h-[600px]">
        <div className="flex h-full">
          {/* 侧边栏 */}
          <div className="w-[240px] border-r bg-muted/10 p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold mb-1">账号</h2>
              <p className="text-xs text-muted-foreground">管理您的账号信息。</p>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                  activeTab === "profile"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <User className="h-4 w-4" />
                个人资料
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                  activeTab === "security"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                安全
              </button>
            </nav>


          </div>

          {/* 内容 */}
          <div className="flex-1 p-8 overflow-y-auto">
            {activeTab === "profile" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-6">个人资料详情</h3>

                  {/* 个人资料部分 */}
                  <div className="py-4 border-b border-border/40">
                    {!isEditingProfile ? (
                      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                        <span className="text-sm font-medium w-40">个人资料</span>
                        <div className="flex-1 flex items-center gap-3">
                          <Avatar className="h-12 w-12 bg-teal-600 text-white">
                            <AvatarImage src={session?.user.image || undefined} />
                            <AvatarFallback className="bg-teal-600 text-white">
                              {session?.user.name?.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{session?.user.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs bg-muted/40 hover:bg-muted/60 cursor-pointer"
                          onClick={() => setIsEditingProfile(true)}
                        >
                          更新资料
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-medium w-40 pt-1">个人资料</span>
                          <div className="flex-1 border rounded-lg p-6 shadow-sm space-y-6">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-sm">更新资料</h4>
                              </div>

                              <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 bg-teal-600 text-white">
                                  <AvatarImage src={session?.user.image || undefined} />
                                  <AvatarFallback className="bg-teal-600 text-white text-xl">
                                    {session?.user.name?.slice(0, 1).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <ImageUpload
                                      value={newAvatarUrl || session?.user.image}
                                      onChange={(url) => setNewAvatarUrl(url)}
                                    />
                                    <div className="flex flex-col gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer w-fit"
                                        onClick={handleAvatarRemove}
                                      >
                                        移除头像
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground">推荐尺寸 1:1，最大 10MB。</p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">姓名</label>
                                <input
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="ghost" onClick={() => setIsEditingProfile(false)} className="cursor-pointer" disabled={isSaving}>取消</Button>
                              <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer" onClick={handleSaveProfile} disabled={isSaving}>
                                {isSaving ? "保存中..." : "保存"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 邮箱部分 */}
                  <div className="py-4 border-b border-border/40">
                    {!isEditingEmail ? (
                      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                        <span className="text-sm font-medium w-40">邮箱地址</span>
                        <div className="flex-1 flex items-center gap-3">
                          <span className="text-sm">{session?.user.email}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-medium border">主邮箱</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs bg-muted/40 hover:bg-muted/60 cursor-pointer"
                          onClick={() => {
                            setIsEditingEmail(true)
                            setEditingEmail(session?.user.email || "")
                          }}
                        >
                          修改邮箱
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-medium w-40 pt-1">邮箱地址</span>
                          <div className="flex-1 border rounded-lg p-6 shadow-sm space-y-6">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm">修改邮箱地址</h4>
                              <p className="text-xs text-muted-foreground">您需要验证新邮箱地址才能完成修改。</p>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">邮箱地址</label>
                                <input
                                  value={editingEmail}
                                  onChange={(e) => setEditingEmail(e.target.value)}
                                  placeholder="输入您的新邮箱地址"
                                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" onClick={() => setIsEditingEmail(false)} className="cursor-pointer">取消</Button>
                              <Button
                                className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                onClick={async () => {
                                  if (editingEmail === session?.user.email) {
                                    toast("邮箱未更改")
                                    setIsEditingEmail(false)
                                    return
                                  }

                                  setIsSaving(true)
                                  try {
                                    const { error } = await authClient.changeEmail({
                                      newEmail: editingEmail,
                                      callbackURL: window.location.origin
                                    })
                                    if (error) {
                                      toast.error(error.message || "更新失败")
                                    } else {
                                      toast.success("邮箱更新邮件已发送，请查收")
                                      setIsEditingEmail(false)
                                    }
                                  } catch (e) {
                                    toast.error("发生错误，请重试")
                                  } finally {
                                    setIsSaving(false)
                                  }
                                }}
                                disabled={isSaving}
                              >
                                {isSaving ? "保存中..." : "保存"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>


                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-6">安全</h3>

                  {/* 密码部分 */}
                  <div className="flex items-center justify-between py-4 border-b border-border/40">
                    <span className="text-sm font-medium w-40">密码</span>
                    <div className="flex-1">
                      <Button variant="ghost" size="sm" className="text-xs bg-muted/40 hover:bg-muted/60 cursor-pointer">设置密码</Button>
                    </div>
                  </div>

                  {/* 活动设备部分 */}
                  <div className="flex items-start justify-between py-4 border-b border-border/40">
                    <span className="text-sm font-medium w-40 pt-1">活动设备</span>
                    <div className="flex-1">
                      {isLoadingSessions ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          加载中...
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activeSessions.map((s) => {
                            const isCurrent = s.id === session?.session?.id
                            const isMobile = /mobile|android|iphone|ipad/i.test(s.userAgent || "")
                            return (
                              <div key={s.id} className="flex items-start gap-4">
                                <div className="h-8 w-10 bg-muted/20 rounded flex items-center justify-center border">
                                  {isMobile ? <Smartphone className="h-5 w-5 text-muted-foreground" /> : <Laptop className="h-5 w-5 text-muted-foreground" />}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                      {isMobile ? "Mobile" : "Desktop"}
                                      {s.userAgent && ` - ${/Chrome|Firefox|Safari|Edge/i.exec(s.userAgent)?.[0] || "Browser"}`}
                                    </span>
                                    {isCurrent && <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-50 text-green-700 font-medium border border-green-200">当前设备</span>}
                                  </div>
                                  <div className="text-xs text-muted-foreground space-y-0.5">
                                    <p>{s.userAgent}</p>
                                    <p>{s.ipAddress} {s.city ? `(${s.city}, ${s.country})` : ""}</p>
                                    <p>{new Date(s.createdAt).toLocaleString('zh-CN')}</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


