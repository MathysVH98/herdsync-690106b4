-- Update is_farm_member function to also recognize employees (preserving parameter order)
CREATE OR REPLACE FUNCTION public.is_farm_member(_user_id uuid, _farm_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farms WHERE id = _farm_id AND owner_id = _user_id
    UNION
    SELECT 1 FROM public.farm_members WHERE farm_id = _farm_id AND user_id = _user_id
    UNION
    SELECT 1 FROM public.employee_users WHERE farm_id = _farm_id AND user_id = _user_id
  )
$$;