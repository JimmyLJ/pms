import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { useNavigate } from "react-router-dom"
import { CreateOrganizationModal } from "@/components/create-org-modal"

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  const { data: organizations, isLoading: isOrgsPending } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => authClient.organization.list().then((res) => res.data),
    enabled: !!session // 仅在用户登录时获取
  })

  useEffect(() => {
    console.log("Home Effect Debug:", {
      isPending,
      isOrgsPending,
      hasSession: !!session,
      activeOrgId: session?.session?.activeOrganizationId,
      orgsCount: organizations?.length
    });

    if (isPending || isOrgsPending) return

    // 1. 如果已有激活的组织，直接跳转
    if (session?.session.activeOrganizationId) {
      navigate(`/w/${session.session.activeOrganizationId}`)
      return
    }

    // 2. 如果没有激活组织，但列表里有组织，自动激活第一个
    if (session && organizations && organizations.length > 0) {
      const firstOrg = organizations[0]
      authClient.organization.setActive({ organizationId: firstOrg.id }).then(() => {
        navigate(`/w/${firstOrg.id}`)
      })
    }
  }, [session, organizations, isPending, isOrgsPending, navigate])

  if (isPending || isOrgsPending) return <div className="p-10 text-center">Loading...</div>

  // If logged in but no organizations, show the create workspace modal
  if (session && organizations && organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <CreateOrganizationModal open={true} onOpenChange={() => { }}>
          {/* Placeholder trigger to satisfy conditional rendering if needed, though strictly not needed with open=true */}
          <div />
        </CreateOrganizationModal>
        <div className="mt-8 text-center text-muted-foreground">
          <p>Please create a workspace to continue.</p>
          <Button variant="link" className="mt-2" onClick={async () => {
            await authClient.signOut()
            navigate("/sign-in")
          }}>
            Sign Out
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-10 border-b pb-6">
        <h1 className="text-3xl font-bold">PMS Dashboard</h1>
        {session && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.email}</span>
            <Button variant="outline" size="sm" onClick={async () => {
              await authClient.signOut()
              navigate("/sign-in")
            }}>Logout</Button>
          </div>
        )}
      </header>

      {session ? (
        <div className="space-y-8">
          <section className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Workspaces</h2>
              <CreateOrganizationModal>
                <Button size="sm">+ New Workspace</Button>
              </CreateOrganizationModal>
            </div>

            {/* This case (organizations.length === 0) should be handled above, 
                but keeping fallback or for transition states */}
            {!organizations || organizations.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">You don't have any workspaces yet.</p>
                <CreateOrganizationModal>
                  <Button>Create your first workspace</Button>
                </CreateOrganizationModal>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {organizations.map((org) => (
                  <div key={org.id} className="p-4 border rounded-md hover:border-primary transition-colors flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{org.name}</h3>
                      <p className="text-xs text-muted-foreground">/{org.slug}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                      authClient.organization.setActive({ organizationId: org.id })
                    }}>
                      {org.id === session.session.activeOrganizationId ? "Active" : "Switch"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-lg">
          <p className="text-xl mb-6">Welcome! Please sign in to manage your projects.</p>
          <Button size="lg" onClick={() => navigate("/sign-in")}>Get Started</Button>
        </div>
      )}
    </div>
  )
}
