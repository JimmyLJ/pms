import { useEffect } from "react"
import { Outlet, useNavigate, useParams } from "react-router-dom"
import { Sidebar } from "./sidebar"
import { authClient } from "@/lib/auth-client"
import { Search, Moon, Sun } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "@/lib/theme"

export default function WorkspaceLayout() {
  const { workspaceId } = useParams()
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b px-6 flex items-center justify-between bg-background sticky top-0 z-10">
          <div className="w-96">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索项目、任务..."
                className="w-full bg-background pl-9 md:w-[300px] lg:w-[400px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user.image || ""} />
              <AvatarFallback>{session?.user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/20 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
