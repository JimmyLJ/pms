import { ChevronDown, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,

  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { CreateOrganizationModal } from "./create-org-modal"

export function WorkspaceSwitcher() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => authClient.organization.list().then((res) => res.data),
    enabled: !!session
  })

  const activeOrg = organizations?.find(
    (org) => org.id === session?.session.activeOrganizationId
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          className="w-full justify-between h-auto px-2 py-2 hover:bg-accent/50"
        >
          <ActiveWorkspaceDisplay activeOrg={activeOrg} />
          <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground/50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] p-0">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground p-2">
          Workspaces
        </DropdownMenuLabel>
        {organizations?.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={async () => {
              await authClient.organization.setActive({ organizationId: org.id })
              navigate(`/w/${org.id}`)
            }}
            className="cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{org.name}</span>
              <span className="text-xs text-muted-foreground">/{org.slug}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="p-2">
          <CreateOrganizationModal>
            <Button variant="outline" className="w-full justify-start h-8 px-2" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </Button>
          </CreateOrganizationModal>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ActiveWorkspaceDisplay({ activeOrg }: { activeOrg?: any }) {
  if (!activeOrg) {
    return <span>Select Workspace</span>
  }

  return (
    <div className="flex items-center gap-3 text-left">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted overflow-hidden">
        {/* Placeholder for organization image/icon */}
        {activeOrg.slug === 'new-org' ?
          <span className="text-xs font-semibold">NO</span> :
          <img src="https://images.unsplash.com/photo-1616469829941-c7200edec809?q=80&w=2670&auto=format&fit=crop" alt="logo" className="h-full w-full object-cover grayscale opacity-80" />
        }
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-none text-foreground">{activeOrg.name}</span>
        <span className="text-xs text-muted-foreground mt-1">1 workspace</span>
      </div>
    </div>
  )
}
