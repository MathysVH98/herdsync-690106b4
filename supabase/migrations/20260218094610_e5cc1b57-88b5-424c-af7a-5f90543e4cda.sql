-- Allow invited users (viewers) to read the farm's subscription
CREATE POLICY "Invited users can view farm subscription"
ON public.subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.farm_invited_users
    WHERE farm_invited_users.user_id = auth.uid()
      AND farm_invited_users.farm_id = subscriptions.farm_id
  )
);