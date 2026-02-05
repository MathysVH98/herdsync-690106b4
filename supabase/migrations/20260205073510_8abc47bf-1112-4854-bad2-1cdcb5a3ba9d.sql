-- Fix search_path for get_invited_user_limit function
CREATE OR REPLACE FUNCTION public.get_invited_user_limit(_tier subscription_tier)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN _tier = 'starter' THEN 0
    WHEN _tier = 'basic' THEN 5
    WHEN _tier = 'pro' THEN 999999
    ELSE 0
  END
$$;