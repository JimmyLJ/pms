import { Check, ChevronDown, Plus } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
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
import { cn } from "@/lib/utils"

export function WorkspaceSwitcher() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const { workspaceId } = useParams()

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => authClient.organization.list().then((res) => res.data),
    enabled: !!session
  })

  const activeOrgId = workspaceId || session?.session.activeOrganizationId
  const activeOrg = organizations?.find((org) => org.id === activeOrgId)
  const totalWorkspaces = organizations?.length ?? 0
  const fallbackImage =
    "https://images.unsplash.com/photo-1616469829941-c7200edec809?q=80&w=2670&auto=format&fit=crop"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          className="w-full justify-between h-auto gap-3 rounded-lg border border-border/60 bg-muted/40 px-2 py-2 shadow-sm hover:cursor-pointer hover:bg-muted/70"
        >
          <ActiveWorkspaceDisplay
            activeOrg={activeOrg}
            totalWorkspaces={totalWorkspaces}
            fallbackImage={fallbackImage}
          />
          <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground/50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60 p-2">
        <DropdownMenuLabel className="px-2 py-1 text-[11px] font-medium tracking-wide text-muted-foreground">
          工作区
        </DropdownMenuLabel>
        {organizations?.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={async () => {
              await authClient.organization.setActive({ organizationId: org.id })
              navigate(`/w/${org.id}`)
            }}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm focus:bg-accent/50",
              org.id === activeOrg?.id && "bg-accent/40"
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted overflow-hidden">
              {org.slug === "new-org" ? (
                <span className="text-xs font-semibold">NO</span>
              ) : (
                <img
                  src={org.logo || fallbackImage}
                  alt={`${org.name} logo`}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <span className="font-medium leading-none">{org.name}</span>
              <span className="mt-1 text-xs text-muted-foreground">
                {getMembersLabel(org)}
              </span>
            </div>
            {org.id === activeOrg?.id ? (
              <Check className="h-4 w-4 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="my-1" />
        <div className="px-1 py-1">
          <CreateOrganizationModal>
            <Button
              variant="ghost"
              className="w-full justify-start h-9 px-2 text-blue-600 hover:text-blue-700 hover:bg-accent/50"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              创建工作区
            </Button>
          </CreateOrganizationModal>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ActiveWorkspaceDisplay({
  activeOrg,
  totalWorkspaces,
  fallbackImage
}: {
  activeOrg?: any
  totalWorkspaces: number
  fallbackImage: string
}) {
  const workspaceLabel = `${totalWorkspaces} 个工作区`
  return (
    <div className="flex items-center gap-3 text-left">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted overflow-hidden">
        {activeOrg?.slug === "new-org" ? (
          <span className="text-xs font-semibold">NO</span>
        ) : (
          <img
            src={activeOrg?.logo || fallbackImage}
            alt="logo"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-none text-foreground">
          {activeOrg?.name || "选择工作区"}
        </span>
        <span className="text-xs text-muted-foreground mt-1">
          {workspaceLabel}
        </span>
      </div>
    </div>
  )
}

function getMembersLabel(org: any) {
  const membersCount =
    typeof org?.membersCount === "number"
      ? org.membersCount
      : Array.isArray(org?.members)
        ? org.members.length
        : null
  if (membersCount === null) return "成员数未知"
  return `${membersCount} 名成员`
}
