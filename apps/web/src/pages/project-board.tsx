import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStart,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { apiFetch } from "@/lib/api-client";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { TaskCard } from "@/components/kanban/task-card";
import { CreateTaskModal } from "@/components/kanban/create-task-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const COLUMNS = [
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "DONE", title: "Done" },
];

export default function ProjectBoardPage() {
  const { workspaceId, projectId } = useParams();
  const queryClient = useQueryClient();
  // ... (rest of the sensors/state)
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any>(null);

  const { data: fetchedTasks, isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => apiFetch<{ data: any[] }>(`/api/tasks?projectId=${projectId}`).then(r => r.data),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (fetchedTasks) {
      setTasks(fetchedTasks);
    }
  }, [fetchedTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: any }) =>
      apiFetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
  });

  const onDragStart = (event: DragStart) => {
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";

    if (!isActiveATask) return;

    // 拖拽任务经过另一个任务
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          tasks[activeIndex].status = tasks[overIndex].status;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // 拖拽任务经过一个列
    const isOverAColumn = COLUMNS.some((col) => col.id === overId);
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        tasks[activeIndex].status = overId as string;
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (activeTask && (workspaceId && projectId)) {
      updateTaskMutation.mutate({
        taskId: activeTask.id,
        updates: {
          status: activeTask.status,
          position: 0, 
        },
      });
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to={`/w/${workspaceId}/projects`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Project Board</h2>
        </div>
        
        {projectId && workspaceId && (
          <CreateTaskModal projectId={projectId} workspaceId={workspaceId} />
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-6 overflow-x-auto pb-4 flex-1 items-start">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted/50 p-4 rounded-lg w-80 shrink-0 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <div className="space-y-3">
                <Skeleton className="h-[100px] w-full rounded-md" />
                <Skeleton className="h-[80px] w-full rounded-md" />
                <Skeleton className="h-[120px] w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4 flex-1 items-start">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                tasks={tasks.filter((t) => t.status === col.id)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
