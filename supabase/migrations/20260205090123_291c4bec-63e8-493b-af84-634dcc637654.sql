
-- Fix security definer views by recreating them as security invoker
-- and using proper RLS on the underlying table

-- Drop existing views
DROP VIEW IF EXISTS employees_secure;
DROP VIEW IF EXISTS employees_safe;

-- Recreate employees_secure view with SECURITY INVOKER (default, explicit for clarity)
-- The view uses is_farm_owner function which handles the permission check
CREATE VIEW employees_secure 
WITH (security_invoker = true)
AS
SELECT 
  e.id,
  e.farm_id,
  e.first_name,
  e.last_name,
  e.role,
  e.status,
  e.start_date,
  e.end_date,
  e.notes,
  e.emergency_contact_name,
  e.uif_registered,
  e.created_at,
  e.updated_at,
  -- Only show contact info to owners
  CASE 
    WHEN is_farm_owner(auth.uid(), e.farm_id) THEN e.phone
    ELSE NULL
  END AS phone,
  CASE 
    WHEN is_farm_owner(auth.uid(), e.farm_id) THEN e.email
    ELSE NULL
  END AS email,
  -- Only show highly sensitive PII to farm owners
  CASE 
    WHEN is_farm_owner(auth.uid(), e.farm_id) THEN e.id_number
    ELSE NULL
  END AS id_number,
  CASE 
    WHEN is_farm_owner(auth.uid(), e.farm_id) THEN e.tax_number
    ELSE NULL
  END AS tax_number,
  CASE 
    WHEN is_farm_owner(auth.uid(), e.farm_id) THEN e.salary
    ELSE NULL
  END AS salary,
  CASE 
    WHEN is_farm_owner(auth.uid(), e.farm_id) THEN e.address
    ELSE NULL
  END AS address,
  CASE 
    WHEN is_farm_owner(auth.uid(), e.farm_id) THEN e.emergency_contact_phone
    ELSE NULL
  END AS emergency_contact_phone
FROM employees e;

-- Recreate employees_safe view with SECURITY INVOKER
CREATE VIEW employees_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  farm_id,
  first_name,
  last_name,
  role,
  status,
  start_date,
  end_date,
  notes,
  created_at,
  updated_at
FROM employees;

-- Update RLS policy - allow farm members to SELECT but only owners see sensitive data via view
-- First drop existing policies
DROP POLICY IF EXISTS "Farm owners can view employees" ON employees;

-- Create policy that allows farm members to view (view handles column masking)
CREATE POLICY "Farm members can view employees via view" 
ON employees FOR SELECT 
USING (is_farm_member(auth.uid(), farm_id));

-- Keep owner-only policies for write operations
-- (these were already created, just ensuring they exist)
DROP POLICY IF EXISTS "Farm owners can create employees" ON employees;
DROP POLICY IF EXISTS "Farm owners can update employees" ON employees;
DROP POLICY IF EXISTS "Farm owners can delete employees" ON employees;

CREATE POLICY "Farm owners can create employees" 
ON employees FOR INSERT 
WITH CHECK (is_farm_owner(auth.uid(), farm_id));

CREATE POLICY "Farm owners can update employees" 
ON employees FOR UPDATE 
USING (is_farm_owner(auth.uid(), farm_id));

CREATE POLICY "Farm owners can delete employees" 
ON employees FOR DELETE 
USING (is_farm_owner(auth.uid(), farm_id));

-- Grant access to views
GRANT SELECT ON employees_secure TO authenticated;
GRANT SELECT ON employees_safe TO authenticated;
