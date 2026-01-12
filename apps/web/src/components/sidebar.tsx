import { LayoutDashboard, Users, Settings, LogOut } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { WorkspaceSwitcher } from "./workspace-switcher"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Separator } from "./ui/separator"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()

  // Helper to determine active state styles
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
    )

  return (
    <div className={cn("pb-12 w-64 border-r bg-background", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <WorkspaceSwitcher />
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Platform
          </h2>
          <div className="space-y-1">
            <NavLink to="." end className={navLinkClass}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink to="projects" className={navLinkClass}>
              <LayoutDashboard className="h-4 w-4" />
              Projects
            </NavLink>
            <NavLink to="members" className={navLinkClass}>
              <Users className="h-4 w-4" />
              Members
            </NavLink>
            <NavLink to="settings" className={navLinkClass}>
              <Settings className="h-4 w-4" />
              Settings
            </NavLink>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-0 w-full px-3">
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
