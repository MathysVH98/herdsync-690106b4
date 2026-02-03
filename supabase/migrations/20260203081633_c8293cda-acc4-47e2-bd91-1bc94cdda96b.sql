-- Add tax number column to employees table
ALTER TABLE public.employees
ADD COLUMN tax_number text;