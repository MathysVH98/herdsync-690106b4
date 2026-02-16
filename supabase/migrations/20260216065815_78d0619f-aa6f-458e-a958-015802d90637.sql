
-- Allow employee users to view employees in their farm (needed for task display and filters)
CREATE POLICY "Employee users can view farm employees"
ON public.employees
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.employee_users eu
    WHERE eu.user_id = auth.uid()
      AND eu.farm_id = employees.farm_id
  )
);
