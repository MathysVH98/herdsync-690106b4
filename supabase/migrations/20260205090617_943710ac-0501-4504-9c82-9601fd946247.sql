
-- Add admin access to security logs and fix remaining issues

-- 1. Allow admins to view login attempt logs for security monitoring
DROP POLICY IF EXISTS "No public access to login logs" ON login_attempt_log;
CREATE POLICY "Admins can view login logs" 
ON login_attempt_log FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- 2. Allow admins to view audit logs
DROP POLICY IF EXISTS "No direct access to audit logs" ON sensitive_data_access_log;
CREATE POLICY "Admins can view audit logs" 
ON sensitive_data_access_log FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- 3. Ensure animal_sales is properly restricted
-- (Only owners can see finalized sales, the secure view masks PII)
DROP POLICY IF EXISTS "Farm members can view animal sales" ON animal_sales;
DROP POLICY IF EXISTS "Farm members can create animal sales" ON animal_sales;
DROP POLICY IF EXISTS "Farm members can update animal sales" ON animal_sales;
DROP POLICY IF EXISTS "Farm members can delete animal sales" ON animal_sales;

-- Only farm owners have full access to animal_sales
CREATE POLICY "Farm owners have full access to animal sales" 
ON animal_sales FOR ALL
USING (is_farm_owner(auth.uid(), farm_id))
WITH CHECK (is_farm_owner(auth.uid(), farm_id));

-- Farm members can only view draft sales (no customer PII on drafts)
CREATE POLICY "Farm members can view draft sales" 
ON animal_sales FOR SELECT 
USING (
  is_farm_member(auth.uid(), farm_id) 
  AND sale_status = 'draft'
);
