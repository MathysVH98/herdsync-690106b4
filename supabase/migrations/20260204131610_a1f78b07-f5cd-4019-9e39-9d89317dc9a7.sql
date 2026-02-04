-- Add new columns to livestock table for detailed animal information
ALTER TABLE public.livestock 
ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('male', 'female', 'unknown')),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS microchip_number TEXT,
ADD COLUMN IF NOT EXISTS brand_mark TEXT,
ADD COLUMN IF NOT EXISTS color_markings TEXT,
ADD COLUMN IF NOT EXISTS sire_id UUID REFERENCES public.livestock(id),
ADD COLUMN IF NOT EXISTS dam_id UUID REFERENCES public.livestock(id),
ADD COLUMN IF NOT EXISTS birth_weight TEXT,
ADD COLUMN IF NOT EXISTS weaning_date DATE,
ADD COLUMN IF NOT EXISTS nursed_by TEXT CHECK (nursed_by IN ('mother', 'bottle', 'other')),
ADD COLUMN IF NOT EXISTS birth_health_status TEXT,
ADD COLUMN IF NOT EXISTS pregnancy_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS previous_owners_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS previous_owners_notes TEXT;

-- Create a birthing_records table to track all births
CREATE TABLE IF NOT EXISTS public.birthing_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  mother_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
  father_id UUID REFERENCES public.livestock(id),
  offspring_id UUID REFERENCES public.livestock(id),
  birth_date DATE NOT NULL DEFAULT CURRENT_DATE,
  birth_weight TEXT,
  health_status_at_birth TEXT,
  nursed_by TEXT CHECK (nursed_by IN ('mother', 'bottle', 'other')),
  weaning_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on birthing_records
ALTER TABLE public.birthing_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for birthing_records
CREATE POLICY "Farm members can view birthing records" 
ON public.birthing_records 
FOR SELECT 
USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create birthing records" 
ON public.birthing_records 
FOR INSERT 
WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update birthing records" 
ON public.birthing_records 
FOR UPDATE 
USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete birthing records" 
ON public.birthing_records 
FOR DELETE 
USING (is_farm_member(auth.uid(), farm_id));

-- Create a feeding_log table for individual animal feeding records
CREATE TABLE IF NOT EXISTS public.feeding_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
  feed_type TEXT NOT NULL,
  quantity TEXT,
  fed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fed_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on feeding_log
ALTER TABLE public.feeding_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for feeding_log
CREATE POLICY "Farm members can view feeding log" 
ON public.feeding_log 
FOR SELECT 
USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create feeding log" 
ON public.feeding_log 
FOR INSERT 
WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update feeding log" 
ON public.feeding_log 
FOR UPDATE 
USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete feeding log" 
ON public.feeding_log 
FOR DELETE 
USING (is_farm_member(auth.uid(), farm_id));