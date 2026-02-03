-- Create farm expenses table for tracking all farm costs
CREATE TABLE public.farm_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  supplier_vendor TEXT,
  receipt_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Farm members can view expenses"
  ON public.farm_expenses FOR SELECT
  USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create expenses"
  ON public.farm_expenses FOR INSERT
  WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update expenses"
  ON public.farm_expenses FOR UPDATE
  USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete expenses"
  ON public.farm_expenses FOR DELETE
  USING (is_farm_member(auth.uid(), farm_id));

-- Create trigger for updated_at
CREATE TRIGGER update_farm_expenses_updated_at
  BEFORE UPDATE ON public.farm_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();