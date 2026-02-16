
-- Allow farm managers to view all employee tasks
CREATE POLICY "Farm managers can view all tasks"
ON public.employee_tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.farm_members
    WHERE farm_id = employee_tasks.farm_id
      AND user_id = auth.uid()
      AND role = 'manager'
  )
);

-- Allow farm managers to view employees
CREATE POLICY "Farm managers can view employees"
ON public.employees
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.farm_members
    WHERE farm_id = employees.farm_id
      AND user_id = auth.uid()
      AND role = 'manager'
  )
);

-- Allow farm managers to view the farm subscription
CREATE POLICY "Farm managers can view farm subscription"
ON public.subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.farm_members
    WHERE farm_id = subscriptions.farm_id
      AND user_id = auth.uid()
      AND role = 'manager'
  )
);
