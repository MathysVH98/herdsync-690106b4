
-- Fix ALL farms policies: they were all RESTRICTIVE which blocks everything
-- PostgreSQL RLS requires at least one PERMISSIVE policy to grant access

-- Drop all existing farms policies
DROP POLICY IF EXISTS "Users can create farms" ON public.farms;
DROP POLICY IF EXISTS "Users can view their own farms" ON public.farms;
DROP POLICY IF EXISTS "Owners can update their farms" ON public.farms;
DROP POLICY IF EXISTS "Owners can delete their farms" ON public.farms;
DROP POLICY IF EXISTS "Admins can view all farms" ON public.farms;

-- Recreate as PERMISSIVE (default) policies
CREATE POLICY "Users can create farms"
ON public.farms
FOR INSERT
TO authenticated
WITH CHECK (
  (owner_id = auth.uid()) AND (NOT is_employee_user(auth.uid()))
);

CREATE POLICY "Users can view their own farms"
ON public.farms
FOR SELECT
TO authenticated
USING (can_access_farm(auth.uid(), id));

CREATE POLICY "Owners can update their farms"
ON public.farms
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their farms"
ON public.farms
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all farms"
ON public.farms
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));
