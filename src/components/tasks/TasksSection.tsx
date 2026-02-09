import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, ClipboardList, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useEmployeeTasks, EmployeeTask } from "@/hooks/useEmployeeTasks";
import { AddTaskDialog } from "./AddTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import { TasksTable } from "./TasksTable";
import { useFarm } from "@/hooks/useFarm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isToday, isPast } from "date-fns";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
}

export function TasksSection() {
  const { farm } = useFarm();
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useEmployeeTasks();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EmployeeTask | null>(null);

  // Fetch active employees for assignment
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-active", farm?.id],
    queryFn: async () => {
      if (!farm?.id) return [];
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, status")
        .eq("farm_id", farm.id)
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!farm?.id,
  });

  const handleAddTask = (data: Parameters<typeof createTask.mutate>[0]) => {
    createTask.mutate(data, {
      onSuccess: () => setIsAddDialogOpen(false),
    });
  };

  const handleEditTask = (data: Parameters<typeof updateTask.mutate>[0]) => {
    updateTask.mutate(data, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setSelectedTask(null);
      },
    });
  };

  const handleDeleteTask = () => {
    if (selectedTask) {
      deleteTask.mutate(selectedTask.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedTask(null);
        },
      });
    }
  };

  const handleMarkComplete = (task: EmployeeTask) => {
    updateTask.mutate({
      id: task.id,
      status: "completed",
      completed_by: task.assigned_to,
    });
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEmployee = filterEmployee === "all" || task.assigned_to === filterEmployee;
    return matchesSearch && matchesEmployee;
  });

  // Categorize tasks
  const pendingTasks = filteredTasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");
  const cancelledTasks = filteredTasks.filter((t) => t.status === "cancelled");

  // Stats
  const overdueTasks = tasks.filter(
    (t) =>
      (t.status === "pending" || t.status === "in_progress") &&
      isPast(new Date(t.due_date)) &&
      !isToday(new Date(t.due_date))
  );
  const dueTodayTasks = tasks.filter(
    (t) => (t.status === "pending" || t.status === "in_progress") && isToday(new Date(t.due_date))
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dueTodayTasks.length}</div>
            <p className="text-xs text-muted-foreground">Tasks due today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex gap-2">
            <Clock className="h-4 w-4" />
            Active ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedTasks.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
          ) : (
            <TasksTable
              tasks={pendingTasks}
              onEdit={(task) => {
                setSelectedTask(task);
                setIsEditDialogOpen(true);
              }}
              onDelete={(taskId) => {
                setSelectedTask(tasks.find((t) => t.id === taskId) || null);
                setIsDeleteDialogOpen(true);
              }}
              onMarkComplete={handleMarkComplete}
            />
          )}
        </TabsContent>

        <TabsContent value="completed">
          <TasksTable
            tasks={completedTasks}
            onEdit={(task) => {
              setSelectedTask(task);
              setIsEditDialogOpen(true);
            }}
            onDelete={(taskId) => {
              setSelectedTask(tasks.find((t) => t.id === taskId) || null);
              setIsDeleteDialogOpen(true);
            }}
            onMarkComplete={handleMarkComplete}
          />
        </TabsContent>

        <TabsContent value="cancelled">
          <TasksTable
            tasks={cancelledTasks}
            onEdit={(task) => {
              setSelectedTask(task);
              setIsEditDialogOpen(true);
            }}
            onDelete={(taskId) => {
              setSelectedTask(tasks.find((t) => t.id === taskId) || null);
              setIsDeleteDialogOpen(true);
            }}
            onMarkComplete={handleMarkComplete}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddTaskDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        employees={employees}
        onSubmit={handleAddTask}
        isSubmitting={createTask.isPending}
      />

      <EditTaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={selectedTask}
        employees={employees}
        onSubmit={handleEditTask}
        isSubmitting={updateTask.isPending}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
