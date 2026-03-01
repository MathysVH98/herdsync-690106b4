-- Fix commodities and commodity_categories SELECT policies (same restrictive-only bug)

DROP POLICY IF EXISTS "Authenticated users can view commodities" ON public.commodities;
CREATE POLICY "Authenticated users can view commodities"
  ON public.commodities
  FOR SELECT
  TO authenticated
  USING (true);

-- Check commodity_categories
DROP POLICY IF EXISTS "Authenticated users can view commodity categories" ON public.commodity_categories;
CREATE POLICY "Authenticated users can view commodity categories"
  ON public.commodity_categories
  FOR SELECT
  TO authenticated
  USING (true);
