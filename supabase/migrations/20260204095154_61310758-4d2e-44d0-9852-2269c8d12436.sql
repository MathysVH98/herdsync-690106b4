-- Fix: Restrict commodity_prices write access to admins only

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert prices" ON public.commodity_prices;
DROP POLICY IF EXISTS "Authenticated users can update prices" ON public.commodity_prices;

-- Create admin-only insert policy
CREATE POLICY "Only admins can insert prices" 
ON public.commodity_prices 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create admin-only update policy
CREATE POLICY "Only admins can update prices" 
ON public.commodity_prices 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));