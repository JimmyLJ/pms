import { useEffect, useState } from "react"
import { Outlet, useNavigate, useParams } from "react-router-dom"
import { Sidebar } from "./sidebar"
import { authClient } from "@/lib/auth-client"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "@/lib/theme"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, LogOut } from "lucide-react"
import { SettingsModal } from "./settings-modal"
import { Search } from "./search"

export default function WorkspaceLayout() {
  const { workspaceId } = useParams()
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      navigate("/sign-in")
      return
    }

    // 如果 URL 中的 ID 与当前 active 不一致，尝试切换
    if (
      session &&
      workspaceId &&
      session.session.activeOrganizationId !== workspaceId
    ) {
      authClient.organization.setActive({ organizationId: workspaceId })
    }
  }, [session, isPending, workspaceId, navigate])

  if (isPending) return <div className="h-screen flex items-center justify-center">Loading Workspace...</div>

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b px-6 flex items-center justify-between bg-background sticky top-0 z-10">
          <Search />
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="hover:cursor-pointer shadow-sm hover:shadow-md transition-shadow"
              onClick={toggleTheme}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-400" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full cursor-pointer overflow-hidden group">
                  <Avatar className="h-9 w-9 bg-teal-600 text-white relative z-10">
                    <AvatarImage src={session?.user.image || ""} />
                    <AvatarFallback className="bg-teal-600 text-white">{session?.user.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-25deg] z-20 pointer-events-none transition-all duration-700 ease-in-out group-hover:left-[200%]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>管理账户</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  await authClient.signOut()
                  navigate("/sign-in")
                }} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/20 p-8">
          <Outlet />
        </main>
      </div>
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  )
}
