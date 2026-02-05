-- Add admin bypass policy for farms table
CREATE POLICY "Admins can view all farms"
ON public.farms
FOR SELECT
USING (has_role(auth.uid(), 'admin'));