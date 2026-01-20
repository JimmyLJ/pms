import { useState } from "react"
import { LayoutDashboard, Users, Settings, Folder, CheckSquare, ChevronDown, ChevronRight, ListTodo, BarChart3, Calendar } from "lucide-react"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { apiFetch } from "@/lib/api-client"
import { WorkspaceSwitcher } from "./workspace-switcher"
import { Separator } from "./ui/separator"
import { SettingsModal } from "./settings-modal"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
  const { data: session } = authClient.useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isTasksOpen, setIsTasksOpen] = useState(true)
  const [isProjectsOpen, setIsProjectsOpen] = useState(true)
  const [expandedProjects, setExpandedProjects] = useState<string[]>([])

  const { data: myTasks = [] } = useQuery({
    queryKey: ["my-tasks", session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return []
      const res = await apiFetch<{ data: any[] }>(`/api/tasks?assigneeId=${session?.user.id}`)
      return res.data || []
    },
    enabled: !!session?.user.id
  })

  const { data: projects = [] } = useQuery({
    queryKey: ["sidebar-projects", session?.session.activeOrganizationId],
    queryFn: async () => {
      if (!session?.session.activeOrganizationId) return []
      const res = await apiFetch<{ data: any[] }>(`/api/projects?workspaceId=${session?.session.activeOrganizationId}&limit=100`)
      return res.data || []
    },
    enabled: !!session?.session.activeOrganizationId
  })

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(p => p !== projectId)
        : [...prev, projectId]
    )
  }

  // 用于确定活动状态样式的辅助函数
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
            <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground w-full text-left"
            >
              <Settings className="h-4 w-4" />
              设置
            </button>
          </div>
        </div>

        <div className="px-3 py-2">
          <div className="space-y-1">
            <button
              onClick={() => setIsTasksOpen(!isTasksOpen)}
              className={cn(
                "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                // Check if we are on my-tasks route? For now just keep it simple or use NavLink for the text only.
              )}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="h-4 w-4" />
                我的任务
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-sm bg-muted text-[10px] text-muted-foreground">
                  {myTasks.length}
                </span>
                {isTasksOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </div>
            </button>

            {isTasksOpen && (
              <div className="pl-9 pr-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {myTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">暂无任务</p>
                ) : (
                  myTasks.map((task: any) => {
                    let dotColor = "bg-gray-400"
                    if (task.status === "DONE") dotColor = "bg-green-500"
                    if (task.status === "IN_PROGRESS") dotColor = "bg-yellow-500"

                    return (
                      <div
                        key={task.id}
                        className="group flex gap-3 py-2 text-xs cursor-pointer hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors"
                        onClick={() => navigate(`/w/${task.organizationId}/projects/${task.projectId}?tab=tasks`)}
                      >
                        <div className={cn("w-2 h-2 rounded-full mt-1 shrink-0", dotColor)} />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-medium text-foreground">{task.title}</span>
                          <span className="text-muted-foreground truncate text-[10px] opacity-80">
                            {task.status.toLowerCase().replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-3 py-2">
          <button
            onClick={() => setIsProjectsOpen(!isProjectsOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          >
            <div className="flex items-center gap-3">
              <Folder className="h-4 w-4" />
              项目
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-sm bg-muted text-[10px] text-muted-foreground">
                {projects.length}
              </span>
              {isProjectsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </div>
          </button>
          {isProjectsOpen && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
              {projects.map((project: any) => {
                const isExpanded = expandedProjects.includes(project.id)
                // Status color mapping
                let statusColor = "bg-gray-400"
                if (project.status === "active") statusColor = "bg-blue-500"
                if (project.status === "completed") statusColor = "bg-green-500"
                if (project.status === "planning") statusColor = "bg-yellow-500"
                if (project.status === "on_hold") statusColor = "bg-orange-500"

                return (
                  <div key={project.id}>
                    <button
                      onClick={() => toggleProject(project.id)}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                      )}
                    >
                      {isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                      <div className={cn("w-2 h-2 rounded-full shrink-0", statusColor)} />
                      <span className="truncate">{project.name}</span>
                    </button>

                    {isExpanded && (
                      <div className="ml-4 pl-4 border-l border-border/40 space-y-1 mt-1 animate-in slide-in-from-top-1 duration-200">
                        <div
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground cursor-pointer",
                            location.pathname.includes(`/projects/${project.id}`) && location.search.includes("tab=tasks") && "text-foreground bg-accent/50"
                          )}
                          onClick={() => navigate(`/w/${session?.session.activeOrganizationId}/projects/${project.id}?tab=tasks`)}
                        >
                          <ListTodo className="h-4 w-4 shrink-0" />
                          <span>任务</span>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground cursor-pointer",
                            location.pathname.includes(`/projects/${project.id}`) && location.search.includes("tab=calendar") && "text-foreground bg-accent/50"
                          )}
                          onClick={() => navigate(`/w/${session?.session.activeOrganizationId}/projects/${project.id}?tab=calendar`)}
                        >
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span>日历</span>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground cursor-pointer",
                            location.pathname.includes(`/projects/${project.id}`) && location.search.includes("tab=analytics") && "text-foreground bg-accent/50"
                          )}
                          onClick={() => navigate(`/w/${session?.session.activeOrganizationId}/projects/${project.id}?tab=analytics`)}
                        >
                          <BarChart3 className="h-4 w-4 shrink-0" />
                          <span>分析</span>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground cursor-pointer",
                            location.pathname.includes(`/projects/${project.id}`) && location.search.includes("tab=settings") && "text-foreground bg-accent/50"
                          )}
                          onClick={() => navigate(`/w/${session?.session.activeOrganizationId}/projects/${project.id}?tab=settings`)}
                        >
                          <Settings className="h-4 w-4 shrink-0" />
                          <span>设置</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>


    </div>
  )
}
