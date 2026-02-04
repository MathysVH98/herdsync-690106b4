-- Fix INSERT policy - check if user is an employee of ANY farm (not the new one being created)
-- Create a helper function to check if user is an employee anywhere

CREATE OR REPLACE FUNCTION public.is_employee_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employee_users
    WHERE user_id = _user_id
  )
$$;

-- Drop and recreate the INSERT policy
DROP POLICY IF EXISTS "Users can create farms" ON public.farms;

CREATE POLICY "Users can create farms"
ON public.farms
FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  AND NOT is_employee_user(auth.uid())
);