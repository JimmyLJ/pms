import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CreateProjectModal } from "@/components/create-project-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Folder } from "lucide-react";

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export default function ProjectsPage() {
  const { workspaceId } = useParams();
  
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => apiFetch<{ data: Project[] }>(`/api/projects?workspaceId=${workspaceId}`).then(r => r.data),
    enabled: !!workspaceId
  });

  if (error) return <div className="text-destructive">Error loading projects</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">Manage your projects and tasks here.</p>
        </div>
        <CreateProjectModal>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </CreateProjectModal>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-[140px]">
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/50">
          <Folder className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No projects yet</h3>
          <p className="text-muted-foreground mb-4">Create your first project to get started.</p>
          <CreateProjectModal>
            <Button variant="outline">Create Project</Button>
          </CreateProjectModal>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} to={`/w/${workspaceId}/projects/${project.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>Created {new Date(project.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    0 tasks active
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
