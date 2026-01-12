import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "./task-card";

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: any[];
}

export function KanbanColumn({ id, title, tasks }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div className="flex flex-col w-80 bg-muted/40 rounded-lg p-4 h-full min-h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          {title} <span className="ml-2 text-xs font-normal">({tasks.length})</span>
        </h3>
      </div>
      
      <div ref={setNodeRef} className="flex-1">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
