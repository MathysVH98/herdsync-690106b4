-- Fix employee farm linking + prevent employees from creating farms
-- Update farms SELECT policy to include employees linked via employee_users
DROP POLICY IF EXISTS "Users can view their own farms" ON public.farms;
CREATE POLICY "Users can view their own farms"
ON public.farms
FOR SELECT
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.farm_members fm
    WHERE fm.farm_id = farms.id
      AND fm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.employee_users eu
    WHERE eu.farm_id = farms.id
      AND eu.user_id = auth.uid()
  )
);

-- Update farms INSERT policy to block employees
DROP POLICY IF EXISTS "Users can create farms" ON public.farms;
CREATE POLICY "Users can create farms"
ON public.farms
FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1
    FROM public.employee_users eu
    WHERE eu.user_id = auth.uid()
  )
);
