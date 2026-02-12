
-- Daily task templates (recurring tasks)
CREATE TABLE public.daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily task completion tracking
CREATE TABLE public.daily_task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed_by UUID NOT NULL REFERENCES public.employees(id),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(daily_task_id, completion_date)
);

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view daily tasks for their farm"
  ON public.daily_tasks FOR SELECT
  USING (farm_id IN (SELECT farm_id FROM public.farm_members WHERE user_id = auth.uid())
    OR farm_id IN (SELECT farm_id FROM public.employee_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert daily tasks for their farm"
  ON public.daily_tasks FOR INSERT
  WITH CHECK (farm_id IN (SELECT farm_id FROM public.farm_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update daily tasks for their farm"
  ON public.daily_tasks FOR UPDATE
  USING (farm_id IN (SELECT farm_id FROM public.farm_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete daily tasks for their farm"
  ON public.daily_tasks FOR DELETE
  USING (farm_id IN (SELECT farm_id FROM public.farm_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can view completions for their farm tasks"
  ON public.daily_task_completions FOR SELECT
  USING (daily_task_id IN (
    SELECT id FROM public.daily_tasks WHERE farm_id IN (
      SELECT farm_id FROM public.farm_members WHERE user_id = auth.uid()
    ) OR farm_id IN (
      SELECT farm_id FROM public.employee_users WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert completions"
  ON public.daily_task_completions FOR INSERT
  WITH CHECK (daily_task_id IN (
    SELECT id FROM public.daily_tasks WHERE farm_id IN (
      SELECT farm_id FROM public.farm_members WHERE user_id = auth.uid()
    ) OR farm_id IN (
      SELECT farm_id FROM public.employee_users WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete completions"
  ON public.daily_task_completions FOR DELETE
  USING (daily_task_id IN (
    SELECT id FROM public.daily_tasks WHERE farm_id IN (
      SELECT farm_id FROM public.farm_members WHERE user_id = auth.uid()
    ) OR farm_id IN (
      SELECT farm_id FROM public.employee_users WHERE user_id = auth.uid()
    )
  ));

CREATE TRIGGER update_daily_tasks_updated_at
  BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
