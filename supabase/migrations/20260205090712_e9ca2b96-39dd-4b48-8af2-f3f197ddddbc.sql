
-- Fix remaining policy gaps

-- 1. Add SELECT policy to invitation_rate_limits (admin only)
CREATE POLICY "Admins can view rate limits" 
ON invitation_rate_limits FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- 2. Ensure compliance_documents storage is secure by adding note about signed URLs
-- (Storage policies already restrict by farm_id folder structure)

-- Done - rate limiting table now has proper SELECT policy
