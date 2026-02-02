-- Create livestock table for farm animals
CREATE TABLE public.livestock (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    breed TEXT,
    tag TEXT NOT NULL,
    age TEXT,
    weight TEXT,
    status TEXT NOT NULL DEFAULT 'Healthy',
    feed_type TEXT,
    last_fed TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Farm members can view livestock" ON public.livestock
    FOR SELECT USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create livestock" ON public.livestock
    FOR INSERT WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update livestock" ON public.livestock
    FOR UPDATE USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete livestock" ON public.livestock
    FOR DELETE USING (is_farm_member(auth.uid(), farm_id));

-- Create health_records table
CREATE TABLE public.health_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    animal_id UUID REFERENCES public.livestock(id) ON DELETE SET NULL,
    animal_name TEXT NOT NULL,
    type TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    provider TEXT,
    notes TEXT,
    next_due DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Farm members can view health records" ON public.health_records
    FOR SELECT USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create health records" ON public.health_records
    FOR INSERT WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update health records" ON public.health_records
    FOR UPDATE USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete health records" ON public.health_records
    FOR DELETE USING (is_farm_member(auth.uid(), farm_id));

-- Create feed_inventory table
CREATE TABLE public.feed_inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'kg',
    reorder_level NUMERIC NOT NULL DEFAULT 0,
    cost_per_unit NUMERIC NOT NULL DEFAULT 0,
    last_restocked DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feed_inventory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Farm members can view feed inventory" ON public.feed_inventory
    FOR SELECT USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create feed inventory" ON public.feed_inventory
    FOR INSERT WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update feed inventory" ON public.feed_inventory
    FOR UPDATE USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete feed inventory" ON public.feed_inventory
    FOR DELETE USING (is_farm_member(auth.uid(), farm_id));

-- Create feeding_schedule table
CREATE TABLE public.feeding_schedule (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    animal_type TEXT NOT NULL,
    feed_type TEXT NOT NULL,
    time TEXT NOT NULL,
    period TEXT NOT NULL DEFAULT 'morning',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feeding_schedule ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Farm members can view feeding schedule" ON public.feeding_schedule
    FOR SELECT USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create feeding schedule" ON public.feeding_schedule
    FOR INSERT WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update feeding schedule" ON public.feeding_schedule
    FOR UPDATE USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete feeding schedule" ON public.feeding_schedule
    FOR DELETE USING (is_farm_member(auth.uid(), farm_id));

-- Create alerts table
CREATE TABLE public.alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    dismissed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Farm members can view alerts" ON public.alerts
    FOR SELECT USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create alerts" ON public.alerts
    FOR INSERT WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update alerts" ON public.alerts
    FOR UPDATE USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete alerts" ON public.alerts
    FOR DELETE USING (is_farm_member(auth.uid(), farm_id));

-- Add updated_at trigger for all new tables
CREATE TRIGGER update_livestock_updated_at
    BEFORE UPDATE ON public.livestock
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_records_updated_at
    BEFORE UPDATE ON public.health_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feed_inventory_updated_at
    BEFORE UPDATE ON public.feed_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feeding_schedule_updated_at
    BEFORE UPDATE ON public.feeding_schedule
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();