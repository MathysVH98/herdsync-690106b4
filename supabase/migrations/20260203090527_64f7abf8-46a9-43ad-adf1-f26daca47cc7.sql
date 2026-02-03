-- Add 'sales' to document_category enum
ALTER TYPE public.document_category ADD VALUE IF NOT EXISTS 'sales';

-- Create animal_status enum
CREATE TYPE public.animal_status AS ENUM ('available', 'sold', 'deceased', 'transferred');

-- Create price_type enum
CREATE TYPE public.price_type AS ENUM ('per_animal', 'per_lot');

-- Create payment_method enum  
CREATE TYPE public.payment_method AS ENUM ('eft', 'cash', 'other');

-- Create ownership_passes enum
CREATE TYPE public.ownership_passes AS ENUM ('on_full_payment', 'on_signature', 'custom');

-- Create risk_passes enum
CREATE TYPE public.risk_passes AS ENUM ('on_loading', 'on_handover', 'on_delivery', 'custom');

-- Create transport_responsibility enum
CREATE TYPE public.transport_responsibility AS ENUM ('buyer', 'seller', 'split', 'custom');

-- Create sale_status enum
CREATE TYPE public.sale_status AS ENUM ('draft', 'finalized');

-- Create animals table
CREATE TABLE public.animals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  animal_tag_id TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  sex TEXT,
  dob_or_age TEXT,
  color_markings TEXT,
  brand_mark TEXT,
  microchip_number TEXT,
  health_notes TEXT,
  status public.animal_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(farm_id, animal_tag_id)
);

-- Create animal_sales table
CREATE TABLE public.animal_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  sale_number TEXT NOT NULL UNIQUE,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sale_location TEXT,
  sale_status public.sale_status NOT NULL DEFAULT 'draft',
  
  -- Seller details
  seller_name TEXT NOT NULL,
  seller_id_or_reg TEXT,
  seller_address TEXT,
  seller_phone TEXT,
  seller_email TEXT,
  seller_vat_number TEXT,
  
  -- Buyer details
  buyer_name TEXT NOT NULL,
  buyer_id_or_reg TEXT,
  buyer_address TEXT,
  buyer_phone TEXT,
  buyer_email TEXT,
  buyer_vat_number TEXT,
  
  -- Pricing
  price_type public.price_type NOT NULL DEFAULT 'per_animal',
  price_per_animal NUMERIC,
  lot_price_total NUMERIC,
  vat_applicable BOOLEAN NOT NULL DEFAULT false,
  vat_rate NUMERIC NOT NULL DEFAULT 15,
  vat_amount NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  
  -- Payment & Delivery
  payment_method public.payment_method DEFAULT 'eft',
  payment_reference TEXT,
  deposit_amount NUMERIC,
  balance_due_date DATE,
  ownership_passes public.ownership_passes DEFAULT 'on_full_payment',
  ownership_passes_custom TEXT,
  risk_passes public.risk_passes DEFAULT 'on_handover',
  risk_passes_custom TEXT,
  transport_responsibility public.transport_responsibility DEFAULT 'buyer',
  transport_responsibility_custom TEXT,
  delivery_details TEXT,
  
  -- Health & Conditions
  health_declaration TEXT,
  warranty_clause TEXT DEFAULT 'Sold as-is / voetstoots unless stated otherwise',
  special_conditions TEXT,
  
  -- Signatures
  seller_signature_name TEXT,
  seller_signature_date DATE,
  buyer_signature_name TEXT,
  buyer_signature_date DATE,
  witness1_name TEXT,
  witness1_signature TEXT,
  witness2_name TEXT,
  witness2_signature TEXT,
  
  -- PDF reference
  pdf_document_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create animal_sale_items table
CREATE TABLE public.animal_sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_sale_id UUID NOT NULL REFERENCES public.animal_sales(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE RESTRICT,
  unit_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(animal_sale_id, animal_id)
);

-- Enable RLS
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_sale_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for animals
CREATE POLICY "Farm members can view animals" ON public.animals
  FOR SELECT USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create animals" ON public.animals
  FOR INSERT WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update animals" ON public.animals
  FOR UPDATE USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete animals" ON public.animals
  FOR DELETE USING (is_farm_member(auth.uid(), farm_id));

-- RLS policies for animal_sales
CREATE POLICY "Farm members can view animal sales" ON public.animal_sales
  FOR SELECT USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can create animal sales" ON public.animal_sales
  FOR INSERT WITH CHECK (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can update animal sales" ON public.animal_sales
  FOR UPDATE USING (is_farm_member(auth.uid(), farm_id));

CREATE POLICY "Farm members can delete animal sales" ON public.animal_sales
  FOR DELETE USING (is_farm_member(auth.uid(), farm_id));

-- RLS policies for animal_sale_items (access via sale)
CREATE POLICY "Farm members can view sale items" ON public.animal_sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.animal_sales 
      WHERE id = animal_sale_items.animal_sale_id 
      AND is_farm_member(auth.uid(), farm_id)
    )
  );

CREATE POLICY "Farm members can create sale items" ON public.animal_sale_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.animal_sales 
      WHERE id = animal_sale_items.animal_sale_id 
      AND is_farm_member(auth.uid(), farm_id)
    )
  );

CREATE POLICY "Farm members can update sale items" ON public.animal_sale_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.animal_sales 
      WHERE id = animal_sale_items.animal_sale_id 
      AND is_farm_member(auth.uid(), farm_id)
    )
  );

CREATE POLICY "Farm members can delete sale items" ON public.animal_sale_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.animal_sales 
      WHERE id = animal_sale_items.animal_sale_id 
      AND is_farm_member(auth.uid(), farm_id)
    )
  );

-- Create indexes
CREATE INDEX idx_animals_farm_id ON public.animals(farm_id);
CREATE INDEX idx_animals_status ON public.animals(status);
CREATE INDEX idx_animal_sales_farm_id ON public.animal_sales(farm_id);
CREATE INDEX idx_animal_sales_sale_number ON public.animal_sales(sale_number);
CREATE INDEX idx_animal_sale_items_sale_id ON public.animal_sale_items(animal_sale_id);

-- Create function to generate sale number
CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
BEGIN
  year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    NULLIF(REGEXP_REPLACE(sale_number, 'AS-' || year_str || '-', '', 'g'), '')::INTEGER
  ), 0) + 1
  INTO seq_num
  FROM public.animal_sales
  WHERE sale_number LIKE 'AS-' || year_str || '-%';
  
  NEW.sale_number := 'AS-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-generating sale number
CREATE TRIGGER set_sale_number
  BEFORE INSERT ON public.animal_sales
  FOR EACH ROW
  WHEN (NEW.sale_number IS NULL OR NEW.sale_number = '')
  EXECUTE FUNCTION public.generate_sale_number();

-- Create trigger for updated_at on animals
CREATE TRIGGER update_animals_updated_at
  BEFORE UPDATE ON public.animals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on animal_sales
CREATE TRIGGER update_animal_sales_updated_at
  BEFORE UPDATE ON public.animal_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();