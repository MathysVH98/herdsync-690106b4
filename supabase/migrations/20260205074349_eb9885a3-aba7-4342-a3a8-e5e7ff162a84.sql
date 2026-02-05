-- Create function to auto-assign admin role to specific email
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user's email is the designated admin email
  IF NEW.email = 'syncherd@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role, assigned_tier)
    VALUES (NEW.id, 'admin', 'pro')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;

-- Create trigger on auth.users to auto-assign admin
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();