
-- Update the invited user limit function with correct tier limits
CREATE OR REPLACE FUNCTION public.get_invited_user_limit(_tier subscription_tier)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN _tier = 'basic' THEN 5
    WHEN _tier = 'starter' THEN 20
    WHEN _tier = 'pro' THEN 999999
    ELSE 0
  END
$function$;
