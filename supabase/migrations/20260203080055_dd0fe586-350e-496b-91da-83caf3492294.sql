-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  id_number TEXT,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'Farm Worker',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  salary NUMERIC DEFAULT 0,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Farm members can view employees"
  ON public.employees FOR SELECT
  USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create employees"
  ON public.employees FOR INSERT
  WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update employees"
  ON public.employees FOR UPDATE
  USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete employees"
  ON public.employees FOR DELETE
  USING (is_farm_member(auth.uid(), farm_id));

-- Add trigger for updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_employees_farm_id ON public.employees(farm_id);
CREATE INDEX idx_employees_status ON public.employees(status);