
-- COMPREHENSIVE SECURITY HARDENING MIGRATION (Part 2 - fixing previous partial apply)

-- Note: animal_sales policies and view were already created in previous partial run

-- 3. Restrict subscription payment details to subscription owner only
DROP POLICY IF EXISTS "Subscription owners can view full details" ON subscriptions;

CREATE POLICY "Subscription owners can view full details" 
ON subscriptions FOR SELECT 
USING (user_id = auth.uid());

-- Create secure view for subscriptions that masks payment info for non-owners
CREATE OR REPLACE VIEW subscriptions_secure
WITH (security_invoker = true)
AS
SELECT 
  id,
  farm_id,
  user_id,
  tier,
  status,
  animal_limit,
  trial_ends_at,
  current_period_end,
  created_at,
  updated_at,
  payment_provider,
  -- Only subscription owner sees payment reference
  CASE WHEN user_id = auth.uid() THEN payment_reference ELSE NULL END AS payment_reference
FROM subscriptions;

GRANT SELECT ON subscriptions_secure TO authenticated;

-- 4. Add rate limiting tracking for farm invitation attempts
CREATE TABLE IF NOT EXISTS invitation_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  email_hash text NOT NULL,
  attempt_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);

ALTER TABLE invitation_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow inserts, no reads (system use only)
DROP POLICY IF EXISTS "System can insert rate limits" ON invitation_rate_limits;
CREATE POLICY "System can insert rate limits" 
ON invitation_rate_limits FOR INSERT 
WITH CHECK (true);

-- 5. Invalidate invitation tokens after first access attempt
ALTER TABLE farm_invitations ADD COLUMN IF NOT EXISTS access_attempted_at timestamptz;

-- Create function to mark token as accessed
CREATE OR REPLACE FUNCTION mark_invitation_accessed(invitation_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE farm_invitations 
  SET access_attempted_at = now()
  WHERE token = invitation_token 
    AND access_attempted_at IS NULL;
END;
$$;

-- 6. Drop the employees_secure view to reduce attack surface
DROP VIEW IF EXISTS employees_secure;

-- 7. Add brute force protection tracking for logins
CREATE TABLE IF NOT EXISTS login_attempt_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username_hash text NOT NULL,
  ip_hash text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);

ALTER TABLE login_attempt_log ENABLE ROW LEVEL SECURITY;

-- No one can read login attempts
DROP POLICY IF EXISTS "No public access to login logs" ON login_attempt_log;
CREATE POLICY "No public access to login logs" 
ON login_attempt_log FOR SELECT 
USING (false);

-- System can insert
DROP POLICY IF EXISTS "System can log attempts" ON login_attempt_log;
CREATE POLICY "System can log attempts" 
ON login_attempt_log FOR INSERT 
WITH CHECK (true);

-- Create function to check rate limiting
CREATE OR REPLACE FUNCTION check_login_rate_limit(username_to_check text)
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
  WHERE username_hash = encode(digest(lower(username_to_check), 'sha256'), 'hex')
    AND success = false
    AND attempted_at > now() - interval '15 minutes';
  
  RETURN recent_failures < 5;
END;
$$;

-- 8. Update commodities/commodity_categories to require authentication
DROP POLICY IF EXISTS "Anyone can view commodities" ON commodities;
DROP POLICY IF EXISTS "Anyone can view commodity categories" ON commodity_categories;

CREATE POLICY "Authenticated users can view commodities" 
ON commodities FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view commodity categories" 
ON commodity_categories FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 9. Update commodity_prices to require authentication
DROP POLICY IF EXISTS "Anyone can view commodity prices" ON commodity_prices;

CREATE POLICY "Authenticated users can view commodity prices" 
ON commodity_prices FOR SELECT 
USING (auth.uid() IS NOT NULL);
