-- Create employee users table to link employees with auth accounts
CREATE TABLE public.employee_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(username),
  UNIQUE(employee_id)
);

-- Create employee permissions table for granular access control
CREATE TABLE public.employee_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_user_id UUID NOT NULL REFERENCES public.employee_users(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  -- Page access permissions
  can_view_livestock BOOLEAN NOT NULL DEFAULT false,
  can_view_feeding BOOLEAN NOT NULL DEFAULT false,
  can_add_feeding BOOLEAN NOT NULL DEFAULT false,
  can_view_health BOOLEAN NOT NULL DEFAULT false,
  can_add_health BOOLEAN NOT NULL DEFAULT false,
  can_view_inventory BOOLEAN NOT NULL DEFAULT false,
  can_add_inventory_usage BOOLEAN NOT NULL DEFAULT false,
  can_view_chemicals BOOLEAN NOT NULL DEFAULT false,
  can_add_chemical_usage BOOLEAN NOT NULL DEFAULT false,
  can_view_documents BOOLEAN NOT NULL DEFAULT false,
  can_upload_documents BOOLEAN NOT NULL DEFAULT false,
  can_view_tracking BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_user_id)
);

-- Enable RLS
ALTER TABLE public.employee_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_employee_users_farm_id ON public.employee_users(farm_id);
CREATE INDEX idx_employee_users_username ON public.employee_users(username);
CREATE INDEX idx_employee_users_user_id ON public.employee_users(user_id);
CREATE INDEX idx_employee_permissions_farm_id ON public.employee_permissions(farm_id);

-- Function to check if user is an employee of a farm
CREATE OR REPLACE FUNCTION public.is_employee_of_farm(_user_id uuid, _farm_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employee_users
    WHERE user_id = _user_id AND farm_id = _farm_id
  )
$$;

-- Function to get employee permissions for current user and farm
CREATE OR REPLACE FUNCTION public.get_employee_permissions(_user_id uuid, _farm_id uuid)
RETURNS TABLE (
  can_view_livestock BOOLEAN,
  can_view_feeding BOOLEAN,
  can_add_feeding BOOLEAN,
  can_view_health BOOLEAN,
  can_add_health BOOLEAN,
  can_view_inventory BOOLEAN,
  can_add_inventory_usage BOOLEAN,
  can_view_chemicals BOOLEAN,
  can_add_chemical_usage BOOLEAN,
  can_view_documents BOOLEAN,
  can_upload_documents BOOLEAN,
  can_view_tracking BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ep.can_view_livestock,
    ep.can_view_feeding,
    ep.can_add_feeding,
    ep.can_view_health,
    ep.can_add_health,
    ep.can_view_inventory,
    ep.can_add_inventory_usage,
    ep.can_view_chemicals,
    ep.can_add_chemical_usage,
    ep.can_view_documents,
    ep.can_upload_documents,
    ep.can_view_tracking
  FROM public.employee_permissions ep
  JOIN public.employee_users eu ON eu.id = ep.employee_user_id
  WHERE eu.user_id = _user_id AND eu.farm_id = _farm_id
  LIMIT 1
$$;

-- Function to check if user can access a farm (owner, member, or employee)
CREATE OR REPLACE FUNCTION public.can_access_farm(_user_id uuid, _farm_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farms WHERE id = _farm_id AND owner_id = _user_id
    UNION
    SELECT 1 FROM public.farm_members WHERE farm_id = _farm_id AND user_id = _user_id
    UNION
    SELECT 1 FROM public.employee_users WHERE farm_id = _farm_id AND user_id = _user_id
  )
$$;

-- RLS policies for employee_users
CREATE POLICY "Farm owners can manage employee users"
ON public.employee_users
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid())
);

CREATE POLICY "Employees can view their own record"
ON public.employee_users
FOR SELECT
USING (user_id = auth.uid());

-- RLS policies for employee_permissions
CREATE POLICY "Farm owners can manage employee permissions"
ON public.employee_permissions
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid())
);

CREATE POLICY "Employees can view their own permissions"
ON public.employee_permissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employee_users eu 
    WHERE eu.id = employee_user_id AND eu.user_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_employee_users_updated_at
BEFORE UPDATE ON public.employee_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_permissions_updated_at
BEFORE UPDATE ON public.employee_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();