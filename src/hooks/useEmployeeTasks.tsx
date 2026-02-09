import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type TaskPriority = Database["public"]["Enums"]["task_priority"];
type TaskStatus = Database["public"]["Enums"]["task_status"];

export interface EmployeeTask {
  id: string;
  farm_id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed_by: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  assigned_employee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  completed_employee?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assigned_to: string;
  due_date: string;
  priority: TaskPriority;
}

export interface UpdateTaskData {
  id: string;
  title?: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  completed_by?: string | null;
  completed_at?: string | null;
}

export function useEmployeeTasks() {
  const { farm } = useFarm();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["employee-tasks", farm?.id],
    queryFn: async () => {
      if (!farm?.id) return [];
      
      const { data, error } = await supabase
        .from("employee_tasks")
        .select(`
          *,
          assigned_employee:employees!employee_tasks_assigned_to_fkey(id, first_name, last_name),
          completed_employee:employees!employee_tasks_completed_by_fkey(id, first_name, last_name)
        `)
        .eq("farm_id", farm.id)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as EmployeeTask[];
    },
    enabled: !!farm?.id,
  });

  const createTask = useMutation({
    mutationFn: async (data: CreateTaskData) => {
      if (!farm?.id || !user?.id) throw new Error("No farm or user");

      const { error } = await supabase.from("employee_tasks").insert({
        farm_id: farm.id,
        title: data.title,
        description: data.description || null,
        assigned_to: data.assigned_to,
        due_date: data.due_date,
        priority: data.priority,
        status: "pending",
        created_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-tasks", farm?.id] });
      toast({ title: "Task created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating task", description: error.message, variant: "destructive" });
    },
  });

  const updateTask = useMutation({
    mutationFn: async (data: UpdateTaskData) => {
      const { id, ...updateData } = data;
      
      // If marking as completed, set completed_at
      if (updateData.status === "completed" && !updateData.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("employee_tasks")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-tasks", farm?.id] });
      toast({ title: "Task updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating task", description: error.message, variant: "destructive" });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("employee_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-tasks", farm?.id] });
      toast({ title: "Task deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting task", description: error.message, variant: "destructive" });
    },
  });

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
  };
}
