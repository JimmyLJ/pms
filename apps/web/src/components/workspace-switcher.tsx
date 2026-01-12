import { ChevronsUpDown, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { CreateOrganizationModal } from "./create-org-modal"

export function WorkspaceSwitcher() {
  const { data: session } = authClient.useSession()
  const { data: organizations } = authClient.organization.list()
  const navigate = useNavigate()

  const activeOrg = organizations?.find(
    (org) => org.id === session?.session.activeOrganizationId
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {activeOrg ? (
            <div className="flex items-center gap-2 truncate">
              <span className="truncate font-semibold">{activeOrg.name}</span>
            </div>
          ) : (
            "Select Workspace"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
