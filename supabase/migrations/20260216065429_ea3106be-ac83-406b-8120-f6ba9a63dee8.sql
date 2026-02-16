
-- 1. Allow employees to view tasks assigned to them
CREATE POLICY "Employees can view their assigned tasks"
ON public.employee_tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.employee_users eu
    WHERE eu.user_id = auth.uid()
      AND eu.farm_id = employee_tasks.farm_id
      AND eu.employee_id = employee_tasks.assigned_to
  )
);

-- 2. Allow employees to update their assigned tasks (e.g., mark complete)
CREATE POLICY "Employees can update their assigned tasks"
ON public.employee_tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.employee_users eu
    WHERE eu.user_id = auth.uid()
      AND eu.farm_id = employee_tasks.farm_id
      AND eu.employee_id = employee_tasks.assigned_to
  )
);

-- 3. Allow employees to view the farm's subscription (needed for Ask a Pro and other features)
CREATE POLICY "Farm employees can view farm subscription"
ON public.subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.employee_users eu
    WHERE eu.user_id = auth.uid()
      AND eu.farm_id = subscriptions.farm_id
  )
);
