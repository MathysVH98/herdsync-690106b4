-- Create general inventory table (replacing feed_inventory concept)
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- Feed, Fuel, Medicine, Tools, Chemicals, Spare Parts
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'units',
  reorder_level NUMERIC NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  storage_location TEXT,
  notes TEXT,
  last_restocked DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory usage log table
CREATE TABLE public.inventory_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  quantity_used NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  used_by TEXT,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory
CREATE POLICY "Farm members can view inventory" 
  ON public.inventory FOR SELECT 
  USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create inventory" 
  ON public.inventory FOR INSERT 
  WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update inventory" 
  ON public.inventory FOR UPDATE 
  USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete inventory" 
  ON public.inventory FOR DELETE 
  USING (is_farm_member(auth.uid(), farm_id));

-- RLS policies for usage log
CREATE POLICY "Farm members can view usage log" 
  ON public.inventory_usage_log FOR SELECT 
  USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create usage log" 
  ON public.inventory_usage_log FOR INSERT 
  WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete usage log" 
  ON public.inventory_usage_log FOR DELETE 
  USING (is_farm_member(auth.uid(), farm_id));

-- Create indexes for better performance
CREATE INDEX idx_inventory_farm_id ON public.inventory(farm_id);
CREATE INDEX idx_inventory_category ON public.inventory(category);
CREATE INDEX idx_inventory_usage_log_inventory_id ON public.inventory_usage_log(inventory_id);
CREATE INDEX idx_inventory_usage_log_farm_id ON public.inventory_usage_log(farm_id);

-- Update timestamp trigger for inventory
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();