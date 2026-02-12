import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/hooks/useFarm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";

export interface DailyTask {
  id: string;
  farm_id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  assigned_employee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface DailyTaskCompletion {
  id: string;
  daily_task_id: string;
  completion_date: string;
  completed_by: string;
  completed_at: string;
}

export interface MissedTask {
  task: DailyTask;
  date: string;
}

export function useDailyTasks() {
  const { farm } = useFarm();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: dailyTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["daily-tasks", farm?.id],
    queryFn: async () => {
      if (!farm?.id) return [];
      const { data, error } = await supabase
        .from("daily_tasks")
        .select(`*, assigned_employee:employees!daily_tasks_assigned_to_fkey(id, first_name, last_name)`)
        .eq("farm_id", farm.id)
        .eq("is_active", true)
        .order("title");
      if (error) throw error;
      return data as DailyTask[];
    },
    enabled: !!farm?.id,
  });

  // Fetch completions for the last 7 days
  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const { data: completions = [], isLoading: completionsLoading } = useQuery({
    queryKey: ["daily-task-completions", farm?.id, sevenDaysAgo],
    queryFn: async () => {
      if (!farm?.id || dailyTasks.length === 0) return [];
      const taskIds = dailyTasks.map((t) => t.id);
      const { data, error } = await supabase
        .from("daily_task_completions")
        .select("*")
        .in("daily_task_id", taskIds)
        .gte("completion_date", sevenDaysAgo);
      if (error) throw error;
      return data as DailyTaskCompletion[];
    },
    enabled: !!farm?.id && dailyTasks.length > 0,
  });

  const isCompletedToday = (taskId: string) => {
    return completions.some((c) => c.daily_task_id === taskId && c.completion_date === today);
  };

  // Calculate missed tasks (last 7 days, excluding today)
  const missedTasks: MissedTask[] = [];
  for (let i = 1; i <= 7; i++) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    for (const task of dailyTasks) {
      // Only count if task was created before that date
      if (task.created_at.slice(0, 10) <= date) {
        const wasCompleted = completions.some(
          (c) => c.daily_task_id === task.id && c.completion_date === date
        );
        if (!wasCompleted) {
          missedTasks.push({ task, date });
        }
      }
    }
  }

  const createDailyTask = useMutation({
    mutationFn: async (data: { title: string; description?: string; assigned_to: string }) => {
      if (!farm?.id || !user?.id) throw new Error("No farm or user");
      const { error } = await supabase.from("daily_tasks").insert({
        farm_id: farm.id,
        title: data.title,
        description: data.description || null,
        assigned_to: data.assigned_to,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-tasks", farm?.id] });
      toast({ title: "Daily task created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating daily task", description: error.message, variant: "destructive" });
    },
  });

  const toggleCompletion = useMutation({
    mutationFn: async ({ taskId, employeeId }: { taskId: string; employeeId: string }) => {
      const existing = completions.find((c) => c.daily_task_id === taskId && c.completion_date === today);
      if (existing) {
        const { error } = await supabase.from("daily_task_completions").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("daily_task_completions").insert({
          daily_task_id: taskId,
          completion_date: today,
          completed_by: employeeId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-task-completions", farm?.id] });
    },
    onError: (error) => {
      toast({ title: "Error updating completion", description: error.message, variant: "destructive" });
    },
  });

  const deleteDailyTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("daily_tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-tasks", farm?.id] });
      toast({ title: "Daily task deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting daily task", description: error.message, variant: "destructive" });
    },
  });

  return {
    dailyTasks,
    completions,
    missedTasks,
    isLoading: tasksLoading || completionsLoading,
    isCompletedToday,
    createDailyTask,
    toggleCompletion,
    deleteDailyTask,
  };
}
