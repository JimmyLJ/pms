import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "mb-3 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <Card>
        <CardContent className="p-3 text-sm font-medium">
          {task.title}
          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground font-normal line-clamp-2">
              {task.description}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
