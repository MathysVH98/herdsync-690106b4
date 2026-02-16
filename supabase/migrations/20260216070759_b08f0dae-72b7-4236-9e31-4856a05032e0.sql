
-- Add role column to farm_invitations to support manager invitations
ALTER TABLE public.farm_invitations 
ADD COLUMN role text NOT NULL DEFAULT 'viewer';

-- Also add RLS policies so managers can view daily tasks and daily task completions
CREATE POLICY "Farm managers can view daily tasks"
ON public.daily_tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.farm_members
    WHERE farm_id = daily_tasks.farm_id
      AND user_id = auth.uid()
      AND role = 'manager'
  )
);

CREATE POLICY "Farm managers can view daily task completions"
ON public.daily_task_completions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.daily_tasks dt
    JOIN public.farm_members fm ON fm.farm_id = dt.farm_id
    WHERE dt.id = daily_task_completions.daily_task_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'manager'
  )
);
