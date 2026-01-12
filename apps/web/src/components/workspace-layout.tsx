import { useEffect } from "react"
import { Outlet, useNavigate, useParams } from "react-router-dom"
import { Sidebar } from "./sidebar"
import { authClient } from "@/lib/auth-client"

export default function WorkspaceLayout() {
  const { workspaceId } = useParams()
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

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
      <main className="flex-1 overflow-y-auto bg-muted/20 p-8">
        <Outlet />
      </main>
    </div>
  )
}
