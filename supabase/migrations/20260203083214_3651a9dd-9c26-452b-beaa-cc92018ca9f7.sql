-- Add UIF registration status to employees table
ALTER TABLE public.employees
ADD COLUMN uif_registered boolean DEFAULT false;