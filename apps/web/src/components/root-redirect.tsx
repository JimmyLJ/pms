import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"
import { useNavigate } from "react-router-dom"

export default function RootRedirect() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  const { data: organizations, isLoading: isOrgsPending } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => authClient.organization.list().then((res) => res.data),
    enabled: !!session,
    retry: false
  })

  useEffect(() => {
    // 1. 等待加载完成
    if (isPending || isOrgsPending) return

    // 2. 未登录 -> 跳转登录页
    if (!session) {
      navigate("/sign-in")
      return
    }

    // 3. 已登录，有激活组织 -> 跳转激活组织
    if (session.session.activeOrganizationId) {
      navigate(`/w/${session.session.activeOrganizationId}`)
      return
    }

    // 4. 已登录，无激活组织但有列表 -> 激活第一个并跳转
    if (organizations && organizations.length > 0) {
      const firstOrg = organizations[0]
      authClient.organization.setActive({ organizationId: firstOrg.id }).then(() => {
        navigate(`/w/${firstOrg.id}`)
      })
      return
    }

    // 5. 已登录，完全无组织 -> 跳转引导页
    if (organizations && organizations.length === 0) {
      navigate("/onboarding")
      return
    }

  }, [session, organizations, isPending, isOrgsPending, navigate])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading PMS...</div>
    </div>
  )
}
