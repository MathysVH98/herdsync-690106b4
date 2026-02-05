
-- FINAL SECURITY HARDENING - Fix all remaining issues

-- 1. Fix subscriptions table - old policy may still exist with wrong conditions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Subscription owners can view full details" ON subscriptions;

-- Only subscription owner can view their subscription (not farm members)
CREATE POLICY "Subscription owner access only" 
ON subscriptions FOR SELECT 
USING (user_id = auth.uid());

-- 2. Fix farm_invitations email comparison - use user_id instead
DROP POLICY IF EXISTS "Users can view their own invitations" ON farm_invitations;

CREATE POLICY "Users can view their pending invitations" 
ON farm_invitations FOR SELECT 
USING (
  -- Farm owners can see all their farm's invitations
  EXISTS (
    SELECT 1 FROM farms 
    WHERE farms.id = farm_invitations.farm_id 
    AND farms.owner_id = auth.uid()
  )
  OR 
  -- Invited users can see their own invitation if they accepted it
  (accepted_by = auth.uid())
);

-- 3. Fix logging tables - restrict INSERT to service role only (system use)
-- Drop overly permissive policies
DROP POLICY IF EXISTS "System can insert rate limits" ON invitation_rate_limits;
DROP POLICY IF EXISTS "System can log attempts" ON login_attempt_log;

-- These tables should only be written to via SECURITY DEFINER functions
-- No direct INSERT access from clients
CREATE POLICY "No direct insert to rate limits" 
ON invitation_rate_limits FOR INSERT 
WITH CHECK (false);

CREATE POLICY "No direct insert to login logs" 
ON login_attempt_log FOR INSERT 
WITH CHECK (false);

-- 4. Fix sensitive_data_access_log - no direct access
DROP POLICY IF EXISTS "Farm owners can view access logs" ON sensitive_data_access_log;

-- Only allow access via SECURITY DEFINER functions
CREATE POLICY "No direct access to audit logs" 
ON sensitive_data_access_log FOR ALL 
USING (false);

-- 5. Create SECURITY DEFINER function for logging login attempts (used by edge function)
CREATE OR REPLACE FUNCTION log_login_attempt(
  p_username_hash text,
  p_ip_hash text,
  p_success boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO login_attempt_log (username_hash, ip_hash, success)
  VALUES (p_username_hash, p_ip_hash, p_success);
END;
$$;

-- Grant execute to authenticated (edge functions run as authenticated via service role)
GRANT EXECUTE ON FUNCTION log_login_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION log_login_attempt TO service_role;

-- 6. Create SECURITY DEFINER function for rate limit logging
CREATE OR REPLACE FUNCTION log_invitation_rate_limit(
  p_ip_hash text,
  p_email_hash text,
  p_success boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO invitation_rate_limits (ip_hash, email_hash, success)
  VALUES (p_ip_hash, p_email_hash, p_success);
END;
$$;

GRANT EXECUTE ON FUNCTION log_invitation_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION log_invitation_rate_limit TO service_role;

-- 7. Ensure employees table policies are strict
DROP POLICY IF EXISTS "Farm members can view employees via view" ON employees;
DROP POLICY IF EXISTS "Farm owners can view employees" ON employees;

-- Only farm owners can directly access employees table
CREATE POLICY "Only farm owners access employees" 
ON employees FOR SELECT 
USING (is_farm_owner(auth.uid(), farm_id));
