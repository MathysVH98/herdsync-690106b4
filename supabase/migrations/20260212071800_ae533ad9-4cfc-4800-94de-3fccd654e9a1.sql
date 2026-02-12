
-- Enable pgcrypto extension for digest() function
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate the rate limit function to use the correct schema reference
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(username_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_failures int;
BEGIN
  SELECT COUNT(*) INTO recent_failures
  FROM login_attempt_log
  WHERE username_hash = encode(extensions.digest(lower(username_to_check)::bytea, 'sha256'), 'hex')
    AND success = false
    AND attempted_at > now() - interval '15 minutes';
  
  RETURN recent_failures < 5;
END;
$$;
