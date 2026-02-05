-- Create enum for invitation status
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- Create farm_invitations table for email-based user invites
CREATE TABLE public.farm_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL,
  email TEXT NOT NULL,
  status invitation_status NOT NULL DEFAULT 'pending',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(farm_id, email)
);

-- Create farm_invited_users table for accepted invitations
CREATE TABLE public.farm_invited_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  invited_by UUID NOT NULL,
  invitation_id UUID REFERENCES public.farm_invitations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(farm_id, user_id)
);

-- Enable RLS
ALTER TABLE public.farm_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_invited_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for farm_invitations
CREATE POLICY "Farm owners can manage invitations"
ON public.farm_invitations
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid())
);

CREATE POLICY "Users can view their own invitations"
ON public.farm_invitations
FOR SELECT
USING (
  LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- RLS policies for farm_invited_users
CREATE POLICY "Farm owners can manage invited users"
ON public.farm_invited_users
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.farms WHERE id = farm_id AND owner_id = auth.uid())
);

CREATE POLICY "Invited users can view their own record"
ON public.farm_invited_users
FOR SELECT
USING (user_id = auth.uid());

-- Update is_farm_member function to include invited users
CREATE OR REPLACE FUNCTION public.is_farm_member(_user_id uuid, _farm_id uuid)
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
    UNION
    SELECT 1 FROM public.farm_invited_users WHERE farm_id = _farm_id AND user_id = _user_id
  )
$$;

-- Update can_access_farm function to include invited users
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
    UNION
    SELECT 1 FROM public.farm_invited_users WHERE farm_id = _farm_id AND user_id = _user_id
  )
$$;

-- Function to check if user is an invited user (not owner)
CREATE OR REPLACE FUNCTION public.is_invited_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farm_invited_users WHERE user_id = _user_id
  )
$$;

-- Function to get invited user limit based on subscription tier
CREATE OR REPLACE FUNCTION public.get_invited_user_limit(_tier subscription_tier)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN _tier = 'starter' THEN 0
    WHEN _tier = 'basic' THEN 5
    WHEN _tier = 'pro' THEN 999999
    ELSE 0
  END
$$;

-- Function to count current invited users for a farm
CREATE OR REPLACE FUNCTION public.count_invited_users(_farm_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.farm_invited_users WHERE farm_id = _farm_id
$$;

-- Add update trigger
CREATE TRIGGER update_farm_invitations_updated_at
  BEFORE UPDATE ON public.farm_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farm_invited_users_updated_at
  BEFORE UPDATE ON public.farm_invited_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();