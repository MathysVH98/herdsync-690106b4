-- Create subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('basic', 'starter', 'pro');

-- Create payment provider enum
CREATE TYPE public.payment_provider AS ENUM ('paypal', 'yoco');

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'cancelled', 'expired', 'past_due');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL DEFAULT 'basic',
    status subscription_status NOT NULL DEFAULT 'trialing',
    payment_provider payment_provider,
    payment_reference TEXT,
    trial_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '14 days'),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    animal_limit INTEGER NOT NULL DEFAULT 80,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (farm_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (user_id = auth.uid() OR is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Users can create their own subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions"
ON public.subscriptions
FOR UPDATE
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid, _farm_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE farm_id = _farm_id
      AND (user_id = _user_id OR is_farm_member(_user_id, _farm_id))
      AND (
        status = 'active'
        OR (status = 'trialing' AND trial_ends_at > now())
      )
  )
$$;

-- Function to get subscription details
CREATE OR REPLACE FUNCTION public.get_subscription_status(_farm_id uuid)
RETURNS TABLE (
  tier subscription_tier,
  status subscription_status,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  animal_limit INTEGER,
  days_remaining INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.tier,
    s.status,
    s.trial_ends_at,
    s.animal_limit,
    GREATEST(0, EXTRACT(DAY FROM s.trial_ends_at - now())::INTEGER) as days_remaining
  FROM public.subscriptions s
  WHERE s.farm_id = _farm_id
  LIMIT 1
$$;