
-- Drop the partially created functions from failed migration
DROP FUNCTION IF EXISTS encrypt_sensitive(text);
DROP FUNCTION IF EXISTS decrypt_sensitive(text);

-- Create function to check if user is farm owner (if not exists)
CREATE OR REPLACE FUNCTION is_farm_owner(user_id uuid, p_farm_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM farms 
    WHERE id = p_farm_id AND owner_id = user_id
  );
$$;

-- Drop the old employees_safe view if exists
DROP VIEW IF EXISTS employees_safe;

-- Create a secure view that masks sensitive data for non-owners
-- Farm owners see everything, employees/members see masked data
CREATE OR REPLACE VIEW employees_secure AS
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
FROM employees e
WHERE is_farm_member(auth.uid(), e.farm_id);

-- Create a minimal safe view for general listing (no sensitive data at all)
CREATE OR REPLACE VIEW employees_safe AS
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
FROM employees
WHERE is_farm_member(auth.uid(), farm_id);

-- Update RLS policies on employees table - restrict to farm owners only
DROP POLICY IF EXISTS "Farm members can view employees" ON employees;
DROP POLICY IF EXISTS "Farm members can create employees" ON employees;
DROP POLICY IF EXISTS "Farm members can update employees" ON employees;
DROP POLICY IF EXISTS "Farm members can delete employees" ON employees;
DROP POLICY IF EXISTS "Farm owners can view employees" ON employees;
DROP POLICY IF EXISTS "Farm owners can create employees" ON employees;
DROP POLICY IF EXISTS "Farm owners can update employees" ON employees;
DROP POLICY IF EXISTS "Farm owners can delete employees" ON employees;

-- Only farm owners can directly access the employees table with sensitive data
CREATE POLICY "Farm owners can view employees" 
ON employees FOR SELECT 
USING (is_farm_owner(auth.uid(), farm_id));

CREATE POLICY "Farm owners can create employees" 
ON employees FOR INSERT 
WITH CHECK (is_farm_owner(auth.uid(), farm_id));

CREATE POLICY "Farm owners can update employees" 
ON employees FOR UPDATE 
USING (is_farm_owner(auth.uid(), farm_id));

CREATE POLICY "Farm owners can delete employees" 
ON employees FOR DELETE 
USING (is_farm_owner(auth.uid(), farm_id));

-- Grant select on views to authenticated users
GRANT SELECT ON employees_safe TO authenticated;
GRANT SELECT ON employees_secure TO authenticated;

-- Clean up the failed encrypted columns if they exist
ALTER TABLE employees DROP COLUMN IF EXISTS id_number_encrypted;
ALTER TABLE employees DROP COLUMN IF EXISTS tax_number_encrypted;
ALTER TABLE employees DROP COLUMN IF EXISTS salary_encrypted;
ALTER TABLE employees DROP COLUMN IF EXISTS address_encrypted;
ALTER TABLE employees DROP COLUMN IF EXISTS emergency_contact_phone_encrypted;

-- Add audit trail for sensitive data access
CREATE TABLE IF NOT EXISTS sensitive_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  farm_id uuid NOT NULL,
  table_name text NOT NULL,
  action text NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

-- Only system can write, owners can read their farm's logs
CREATE POLICY "Farm owners can view access logs" 
ON sensitive_data_access_log FOR SELECT 
USING (is_farm_owner(auth.uid(), farm_id));

-- Create function to log sensitive data access
CREATE OR REPLACE FUNCTION log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO sensitive_data_access_log (user_id, farm_id, table_name, action)
  VALUES (auth.uid(), NEW.farm_id, TG_TABLE_NAME, TG_OP);
  RETURN NEW;
END;
$$;

-- Add trigger to log employee data access
DROP TRIGGER IF EXISTS log_employee_access ON employees;
CREATE TRIGGER log_employee_access
  AFTER INSERT OR UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION log_sensitive_access();
