
-- Drop the restrictive INSERT policy and recreate as permissive
DROP POLICY IF EXISTS "Users can create farms" ON public.farms;

CREATE POLICY "Users can create farms"
ON public.farms
FOR INSERT
TO authenticated
WITH CHECK (
  (owner_id = auth.uid()) AND (NOT is_employee_user(auth.uid()))
);
