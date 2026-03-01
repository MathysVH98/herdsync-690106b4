-- Fix: The existing SELECT policy is RESTRICTIVE but there's no PERMISSIVE policy,
-- so no rows are ever returned. Drop the restrictive policy and recreate as permissive.

DROP POLICY IF EXISTS "Authenticated users can view commodity prices" ON public.commodity_prices;

CREATE POLICY "Authenticated users can view commodity prices"
  ON public.commodity_prices
  FOR SELECT
  TO authenticated
  USING (true);
