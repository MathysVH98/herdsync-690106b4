-- Create table for monthly compliance checklists
CREATE TABLE public.monthly_compliance_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM' to track which month this checklist is for
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(farm_id, category_id, item_id, month_year)
);

-- Enable RLS
ALTER TABLE public.monthly_compliance_checklists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Farm members can view monthly checklists"
ON public.monthly_compliance_checklists
FOR SELECT
USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create monthly checklists"
ON public.monthly_compliance_checklists
FOR INSERT
WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update monthly checklists"
ON public.monthly_compliance_checklists
FOR UPDATE
USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete monthly checklists"
ON public.monthly_compliance_checklists
FOR DELETE
USING (is_farm_member(auth.uid(), farm_id));

-- Create trigger for updated_at
CREATE TRIGGER update_monthly_compliance_checklists_updated_at
BEFORE UPDATE ON public.monthly_compliance_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_monthly_compliance_checklists_farm_month 
ON public.monthly_compliance_checklists(farm_id, month_year);

CREATE INDEX idx_monthly_compliance_checklists_category 
ON public.monthly_compliance_checklists(farm_id, category_id, month_year);