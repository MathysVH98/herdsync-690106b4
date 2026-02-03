-- Create a farm_equipment table for tracking tractors, planters, etc.
CREATE TABLE public.farm_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  serial_number TEXT,
  purchase_date DATE,
  purchase_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_value NUMERIC(12,2),
  condition TEXT DEFAULT 'Good',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.farm_equipment ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their farm equipment"
  ON public.farm_equipment
  FOR SELECT
  USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Users can create farm equipment"
  ON public.farm_equipment
  FOR INSERT
  WITH CHECK (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Users can update their farm equipment"
  ON public.farm_equipment
  FOR UPDATE
  USING (public.is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Users can delete their farm equipment"
  ON public.farm_equipment
  FOR DELETE
  USING (public.is_farm_member(auth.uid(), farm_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_farm_equipment_updated_at
  BEFORE UPDATE ON public.farm_equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();