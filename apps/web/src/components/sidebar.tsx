import { useState } from "react"
import { LayoutDashboard, Users, Settings, LogOut, Folder, CheckSquare } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { WorkspaceSwitcher } from "./workspace-switcher"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Separator } from "./ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Helper to determine active state styles
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
    )

  return (
    <div className={cn("pb-12 w-64 border-r bg-background flex flex-col h-screen overflow-y-auto", className)}>
      <div className="py-4 flex-1">
        <div className="px-3 py-2">
          <WorkspaceSwitcher />
        </div>
        <Separator className="my-2 bg-border" />
        <div className="px-3 py-2">
          <div className="space-y-1">
            <NavLink to="." end className={navLinkClass}>
              <LayoutDashboard className="h-4 w-4" />
              仪表盘
            </NavLink>
            <NavLink to="projects" className={navLinkClass}>
              <Folder className="h-4 w-4" />
              项目
            </NavLink>
            <NavLink to="members" className={navLinkClass}>
              <Users className="h-4 w-4" />
              团队
            </NavLink>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground w-full text-left">
                  <Settings className="h-4 w-4" />
                  设置
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>设置</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-muted-foreground text-center">
                  设置
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="px-3 py-2">
          <NavLink to="my-tasks" className={({ isActive }) =>
            cn(
              "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )
          }>
            <div className="flex items-center gap-3">
              <CheckSquare className="h-4 w-4" />
              我的任务
            </div>
            <span className="flex items-center justify-center w-5 h-5 rounded-sm bg-muted text-[10px] text-muted-foreground">0</span>
          </NavLink>
        </div>
      </div>

      <div className="px-3 pb-4">
        <Separator className="mb-4" />
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user.image || ""} />
              <AvatarFallback>{session?.user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-medium">{session?.user.name}</span>
              <span className="text-[10px] text-muted-foreground truncate w-24">{session?.user.email}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => {
            authClient.signOut().then(() => navigate("/sign-in"))
          }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
