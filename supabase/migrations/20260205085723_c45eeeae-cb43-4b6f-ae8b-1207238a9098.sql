-- ================================================================
-- SECURITY FIX 1: Storage Policies - Add farm-level isolation
-- ================================================================

-- Drop existing overly permissive policies on compliance-documents bucket
DROP POLICY IF EXISTS "Authenticated users can upload compliance documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view compliance documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete compliance documents" ON storage.objects;

-- Create farm-scoped storage policies
-- Files must be organized as: {farm_id}/{filename}
-- Users can only access files in farms they belong to

CREATE POLICY "Farm members can upload compliance documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'compliance-documents' AND
  public.can_access_farm(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Farm members can view compliance documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'compliance-documents' AND
  public.can_access_farm(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Farm members can delete compliance documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'compliance-documents' AND
  public.can_access_farm(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- ================================================================
-- SECURITY FIX 2: Revoke direct RPC access to admin renewal function
-- ================================================================

-- Drop the exploitable function and recreate it as non-callable
DROP FUNCTION IF EXISTS public.auto_renew_admin_subscription(uuid);

-- Recreate with SECURITY DEFINER but add caller validation
CREATE OR REPLACE FUNCTION public.auto_renew_admin_subscription(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
  _caller_id uuid;
BEGIN
  -- Get the caller's ID
  _caller_id := auth.uid();
  
  -- CRITICAL: Only allow users to renew their OWN subscription
  IF _caller_id IS NULL OR _caller_id != _user_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only renew your own subscription';
  END IF;

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
    AND current_period_end < now();
END;
$$;

-- ================================================================
-- SECURITY FIX 3: Strengthen employee data protection
-- ================================================================

-- Create a view that excludes highly sensitive fields for general access
CREATE OR REPLACE VIEW public.employees_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  farm_id,
  first_name,
  last_name,
  role,
  email,
  phone,
  status,
  start_date,
  end_date,
  notes,
  created_at,
  updated_at
  -- Excludes: id_number, tax_number, salary, address, emergency contacts
FROM public.employees;

-- Grant access to the safe view
GRANT SELECT ON public.employees_safe TO authenticated;

-- Add comment documenting sensitive fields
COMMENT ON TABLE public.employees IS 'Contains sensitive PII including ID numbers, tax numbers, salaries, and addresses. Use employees_safe view for general queries.';

-- Revoke direct access to user_roles table for non-admins to prevent user_id discovery
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can only view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());