import { format, isPast, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, CheckCircle } from "lucide-react";
import { EmployeeTask } from "@/hooks/useEmployeeTasks";
import { cn } from "@/lib/utils";

interface TasksTableProps {
  tasks: EmployeeTask[];
  onEdit: (task: EmployeeTask) => void;
  onDelete: (taskId: string) => void;
  onMarkComplete: (task: EmployeeTask) => void;
}

const priorityConfig = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  high: { label: "High", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  urgent: { label: "Urgent", className: "bg-destructive/10 text-destructive" },
};

const statusConfig = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground line-through" },
};

export function TasksTable({ tasks, onEdit, onDelete, onMarkComplete }: TasksTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No tasks found. Create your first task to get started.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Completed By</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const dueDate = new Date(task.due_date);
            const isOverdue = isPast(dueDate) && !isToday(dueDate) && task.status !== "completed" && task.status !== "cancelled";
            const isDueToday = isToday(dueDate) && task.status !== "completed" && task.status !== "cancelled";

            return (
              <TableRow key={task.id}>
                <TableCell>
                  <div>
                    <p className={cn("font-medium", task.status === "cancelled" && "line-through text-muted-foreground")}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {task.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {task.assigned_employee
                    ? `${task.assigned_employee.first_name} ${task.assigned_employee.last_name}`
                    : "Unknown"}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      isOverdue && "text-destructive font-medium",
                      isDueToday && "text-orange-600 dark:text-orange-400 font-medium"
                    )}
                  >
                    {format(dueDate, "MMM d, yyyy")}
                    {isOverdue && " (Overdue)"}
                    {isDueToday && " (Today)"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={priorityConfig[task.priority].className}>
                    {priorityConfig[task.priority].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusConfig[task.status].className}>
                    {statusConfig[task.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.completed_employee
                    ? `${task.completed_employee.first_name} ${task.completed_employee.last_name}`
                    : "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {task.status !== "completed" && task.status !== "cancelled" && (
                        <DropdownMenuItem onClick={() => onMarkComplete(task)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark Complete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(task)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(task.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
