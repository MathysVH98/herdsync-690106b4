import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, RotateCcw } from "lucide-react";
import { DailyTask, MissedTask } from "@/hooks/useDailyTasks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface DailyTasksListProps {
  dailyTasks: DailyTask[];
  missedTasks: MissedTask[];
  isCompletedToday: (taskId: string) => boolean;
  onToggle: (taskId: string, employeeId: string) => void;
  onDelete: (taskId: string) => void;
  isEmployee?: boolean;
  filterEmployee?: string;
}

export function DailyTasksList({
  dailyTasks,
  missedTasks,
  isCompletedToday,
  onToggle,
  onDelete,
  isEmployee,
  filterEmployee,
}: DailyTasksListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = filterEmployee && filterEmployee !== "all"
    ? dailyTasks.filter((t) => t.assigned_to === filterEmployee)
    : dailyTasks;

  const filteredMissed = filterEmployee && filterEmployee !== "all"
    ? missedTasks.filter((m) => m.task.assigned_to === filterEmployee)
    : missedTasks;

  if (filtered.length === 0 && filteredMissed.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Today's Daily Tasks */}
      {filtered.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              Daily Tasks — {format(new Date(), "MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filtered.map((task) => {
              const completed = isCompletedToday(task.id);
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={completed}
                    onCheckedChange={() => onToggle(task.id, task.assigned_to)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${completed ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {task.assigned_employee
                      ? `${task.assigned_employee.first_name} ${task.assigned_employee.last_name}`
                      : "Unknown"}
                  </Badge>
                  {!isEmployee && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Missed Tasks */}
      {filteredMissed.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Missed Daily Tasks (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredMissed.map((missed, idx) => (
              <div
                key={`${missed.task.id}-${missed.date}-${idx}`}
                className="flex items-center gap-2 p-2 rounded-md bg-warning/10 text-sm"
              >
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                <span>
                  <strong>{missed.task.title}</strong> was not completed on{" "}
                  <strong>{format(new Date(missed.date + "T00:00:00"), "yyyy/MM/dd")}</strong> by{" "}
                  <strong>
                    {missed.task.assigned_employee
                      ? `${missed.task.assigned_employee.first_name} ${missed.task.assigned_employee.last_name}`
                      : "Unknown"}
                  </strong>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Daily Task</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this daily task and all its completion history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
