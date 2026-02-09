-- Add RLS policies to employees_safe view
-- First, enable RLS on the view (views inherit from base table but explicit policies help)
ALTER VIEW public.employees_safe SET (security_invoker = true);

-- Create a policy function for checking view access
CREATE OR REPLACE FUNCTION public.can_view_employees(_user_id uuid, _farm_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    -- Farm owner can view
    SELECT 1 FROM public.farms WHERE id = _farm_id AND owner_id = _user_id
    UNION
    -- Farm members can view
    SELECT 1 FROM public.farm_members WHERE farm_id = _farm_id AND user_id = _user_id
    UNION
    -- Employee users can view their coworkers (limited)
    SELECT 1 FROM public.employee_users WHERE farm_id = _farm_id AND user_id = _user_id
  )
$$;

-- Drop existing policies on employees table if they exist and recreate with tighter controls
DROP POLICY IF EXISTS "Farm members can view employees" ON public.employees;
DROP POLICY IF EXISTS "Farm owners can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Farm owners can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Farm owners can update employees" ON public.employees;
DROP POLICY IF EXISTS "Farm owners can delete employees" ON public.employees;

-- Create stricter RLS policies for employees table
-- Only farm owners can see full employee data (including sensitive PII)
CREATE POLICY "Farm owners can view all employee data" 
ON public.employees 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farms 
    WHERE id = employees.farm_id AND owner_id = auth.uid()
  )
);

-- Farm owners can insert employees
CREATE POLICY "Farm owners can insert employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farms 
    WHERE id = farm_id AND owner_id = auth.uid()
  )
);

-- Farm owners can update employees
CREATE POLICY "Farm owners can update employees" 
ON public.employees 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.farms 
    WHERE id = employees.farm_id AND owner_id = auth.uid()
  )
);

-- Farm owners can delete employees
CREATE POLICY "Farm owners can delete employees" 
ON public.employees 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.farms 
    WHERE id = employees.farm_id AND owner_id = auth.uid()
  )
);

-- Add comment documenting sensitive columns
COMMENT ON COLUMN public.employees.id_number IS 'SENSITIVE: South African ID number - restrict access';
COMMENT ON COLUMN public.employees.tax_number IS 'SENSITIVE: Tax registration number - restrict access';
COMMENT ON COLUMN public.employees.salary IS 'SENSITIVE: Employee salary - restrict access';
COMMENT ON COLUMN public.employees.address IS 'SENSITIVE: Home address - restrict access';
COMMENT ON COLUMN public.employees.emergency_contact_phone IS 'SENSITIVE: Emergency contact - restrict access';

-- Ensure employee_tasks table has proper RLS for the new task system
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Farm owners can manage tasks" ON public.employee_tasks;
DROP POLICY IF EXISTS "Farm owners can view tasks" ON public.employee_tasks;
DROP POLICY IF EXISTS "Farm owners can insert tasks" ON public.employee_tasks;
DROP POLICY IF EXISTS "Farm owners can update tasks" ON public.employee_tasks;
DROP POLICY IF EXISTS "Farm owners can delete tasks" ON public.employee_tasks;

-- Recreate comprehensive task policies
CREATE POLICY "Farm owners can view all tasks" 
ON public.employee_tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.farms 
    WHERE id = employee_tasks.farm_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Farm owners can insert tasks" 
ON public.employee_tasks 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farms 
    WHERE id = farm_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Farm owners can update tasks" 
ON public.employee_tasks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.farms 
    WHERE id = employee_tasks.farm_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Farm owners can delete tasks" 
ON public.employee_tasks 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.farms 
    WHERE id = employee_tasks.farm_id AND owner_id = auth.uid()
  )
);