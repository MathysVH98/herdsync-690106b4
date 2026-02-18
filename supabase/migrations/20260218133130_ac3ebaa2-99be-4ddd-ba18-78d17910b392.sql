-- Create a secure function to handle farm creation that bypasses RLS
-- This is safer as it validates the user and creates all related records atomically
CREATE OR REPLACE FUNCTION public.create_farm_for_user(
  _name text,
  _address text DEFAULT NULL,
  _province text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _farm_id uuid;
  _is_employee boolean;
BEGIN
  -- Get the authenticated user
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user is an employee (employees cannot create farms)
  SELECT EXISTS (
    SELECT 1 FROM public.employee_users WHERE user_id = _user_id
  ) INTO _is_employee;
  
  IF _is_employee THEN
    RAISE EXCEPTION 'Employee users cannot create farms';
  END IF;
  
  -- Create the farm
  INSERT INTO public.farms (name, owner_id, address, province)
  VALUES (_name, _user_id, _address, _province)
  RETURNING id INTO _farm_id;
  
  -- Add user as farm member with owner role
  INSERT INTO public.farm_members (farm_id, user_id, role)
  VALUES (_farm_id, _user_id, 'owner');
  
  -- Create a subscription for the new farm (14-day trial)
  INSERT INTO public.subscriptions (farm_id, user_id, tier, status)
  VALUES (_farm_id, _user_id, 'basic', 'trialing');
  
  RETURN _farm_id;
END;
$$;