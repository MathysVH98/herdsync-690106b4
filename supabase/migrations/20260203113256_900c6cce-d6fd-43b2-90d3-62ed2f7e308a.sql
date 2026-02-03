-- Create a function to auto-renew admin subscriptions
CREATE OR REPLACE FUNCTION public.auto_renew_admin_subscription(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
  _subscription_id uuid;
BEGIN
  -- Check if user is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  ) INTO _is_admin;

  IF NOT _is_admin THEN
    RETURN;
  END IF;

  -- Find and renew expired subscription for this admin
  UPDATE public.subscriptions
  SET 
    current_period_start = now(),
    current_period_end = now() + INTERVAL '1 month',
    status = 'active',
    updated_at = now()
  WHERE user_id = _user_id
    AND current_period_end < now()
  RETURNING id INTO _subscription_id;
  
END;
$$;