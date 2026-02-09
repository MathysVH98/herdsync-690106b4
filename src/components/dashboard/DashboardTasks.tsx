import { useEmployeeTasks } from "@/hooks/useEmployeeTasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { isToday, isPast, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const priorityConfig = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  high: { label: "High", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  urgent: { label: "Urgent", className: "bg-destructive/10 text-destructive" },
};

export function DashboardTasks() {
  const { tasks, isLoading } = useEmployeeTasks();
  const navigate = useNavigate();

  // Calculate stats
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const overdueTasks = tasks.filter(
    (t) =>
      (t.status === "pending" || t.status === "in_progress") &&
      isPast(new Date(t.due_date)) &&
      !isToday(new Date(t.due_date))
  );
  const dueTodayTasks = tasks.filter(
    (t) => (t.status === "pending" || t.status === "in_progress") && isToday(new Date(t.due_date))
  );

  // Get upcoming tasks (pending, sorted by due date)
  const upcomingTasks = pendingTasks
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 4);

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg text-foreground">
          Employee Tasks
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary hover:text-primary/80"
          onClick={() => navigate("/employees")}
        >
          View All
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <ClipboardList className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{tasks.length}</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Total Tasks</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <Clock className="h-4 w-4 text-blue-700 dark:text-blue-300" />
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{pendingTasks.length}</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">Pending</p>
        </div>
        <div className="bg-orange-100 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <AlertCircle className="h-4 w-4 text-orange-700 dark:text-orange-300" />
          </div>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">{dueTodayTasks.length}</p>
          <p className="text-xs text-orange-700 dark:text-orange-300">Due Today</p>
        </div>
        <div className="bg-red-100 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <AlertCircle className="h-4 w-4 text-red-700 dark:text-red-300" />
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{overdueTasks.length}</p>
          <p className="text-xs text-red-700 dark:text-red-300">Overdue</p>
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
      ) : upcomingTasks.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No active tasks. Go to Employees to create tasks.
        </p>
      ) : (
        <div className="space-y-3">
          {upcomingTasks.map((task) => {
            const dueDate = new Date(task.due_date);
            const isOverdue = isPast(dueDate) && !isToday(dueDate);
            const isDueToday = isToday(dueDate);

            return (
              <div 
                key={task.id} 
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  isOverdue 
                    ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" 
                    : isDueToday 
                    ? "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800" 
                    : "bg-card border-border"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <Badge variant="outline" className={cn("text-xs shrink-0", priorityConfig[task.priority].className)}>
                      {priorityConfig[task.priority].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {task.assigned_employee
                        ? `${task.assigned_employee.first_name} ${task.assigned_employee.last_name}`
                        : "Unassigned"}
                    </span>
                    <span>•</span>
                    <span className={cn(
                      isOverdue && "text-destructive font-medium",
                      isDueToday && "text-orange-600 dark:text-orange-400 font-medium"
                    )}>
                      {format(dueDate, "MMM d, yyyy")}
                      {isOverdue && " (Overdue)"}
                      {isDueToday && " (Today)"}
                    </span>
                  </div>
                </div>
                {task.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
