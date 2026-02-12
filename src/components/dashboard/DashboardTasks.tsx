import { useEmployeeTasks } from "@/hooks/useEmployeeTasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { isToday, isPast, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const priorityConfig = {
  low: { label: "Low", className: "bg-background border-border text-muted-foreground" },
  medium: { label: "Medium", className: "bg-background border-info text-info" },
  high: { label: "High", className: "bg-background border-warning text-warning" },
  urgent: { label: "Urgent", className: "bg-background border-destructive text-destructive" },
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
          className="text-primary hover:text-primary hover:underline"
          onClick={() => navigate("/employee-tasks")}
        >
          View All
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-card border border-border border-l-4 border-l-primary rounded-lg p-3">
          <div className="flex items-center justify-between">
            <ClipboardList className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{tasks.length}</p>
          <p className="text-xs text-muted-foreground">Total Tasks</p>
        </div>
        <div className="bg-card border border-border border-l-4 border-l-info rounded-lg p-3">
          <div className="flex items-center justify-between">
            <Clock className="h-4 w-4 text-info" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{pendingTasks.length}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card border border-border border-l-4 border-l-warning rounded-lg p-3">
          <div className="flex items-center justify-between">
            <AlertCircle className="h-4 w-4 text-warning" />
          </div>
          <p className="text-2xl font-bold text-warning mt-1">{dueTodayTasks.length}</p>
          <p className="text-xs text-muted-foreground">Due Today</p>
        </div>
        <div className="bg-card border border-border border-l-4 border-l-destructive rounded-lg p-3">
          <div className="flex items-center justify-between">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <p className="text-2xl font-bold text-destructive mt-1">{overdueTasks.length}</p>
          <p className="text-xs text-muted-foreground">Overdue</p>
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
                  "flex items-start gap-3 p-3 rounded-lg border bg-card",
                  isOverdue 
                    ? "border-destructive" 
                    : isDueToday 
                    ? "border-warning" 
                    : "border-border"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs shrink-0 bg-background",
                        priorityConfig[task.priority].className,
                      )}
                    >
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
                    <span
                      className={cn(
                        isOverdue && "text-destructive font-medium",
                        isDueToday && "text-warning font-medium",
                      )}
                    >
                      {format(dueDate, "MMM d, yyyy")}
                      {isOverdue && " (Overdue)"}
                      {isDueToday && " (Today)"}
                    </span>
                  </div>
                </div>
                {task.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
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
