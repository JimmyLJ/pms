import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { useNavigate } from "react-router-dom"
import { CreateOrganizationModal } from "@/components/create-org-modal"

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession()
  const { data: organizations, isPending: isOrgsPending } = authClient.organization.list()
  const navigate = useNavigate()

  useEffect(() => {
    // 如果有 session 且已经有激活的组织，则自动跳转
    if (!isPending && session?.session.activeOrganizationId) {
      navigate(`/w/${session.session.activeOrganizationId}`)
    }
  }, [session, isPending, navigate])

  if (isPending || isOrgsPending) return <div className="p-10 text-center">Loading...</div>

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
