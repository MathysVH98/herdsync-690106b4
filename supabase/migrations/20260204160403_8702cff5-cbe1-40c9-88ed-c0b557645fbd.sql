-- Fix infinite recursion in farms RLS policy
-- Use the existing can_access_farm function which is SECURITY DEFINER

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own farms" ON public.farms;
DROP POLICY IF EXISTS "Users can create farms" ON public.farms;

-- Recreate SELECT policy using the SECURITY DEFINER function
CREATE POLICY "Users can view their own farms"
ON public.farms
FOR SELECT
USING (can_access_farm(auth.uid(), id));

-- Recreate INSERT policy - employees cannot create farms
-- Use is_employee_of_farm function which is also SECURITY DEFINER
CREATE POLICY "Users can create farms"
ON public.farms
FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  AND NOT is_employee_of_farm(auth.uid(), id)
);