-- Create table for commodity categories
CREATE TABLE public.commodity_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for commodities
CREATE TABLE public.commodities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.commodity_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, name)
);

-- Create table for daily commodity prices
CREATE TABLE public.commodity_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commodity_id UUID NOT NULL REFERENCES public.commodities(id) ON DELETE CASCADE,
  price DECIMAL(12, 2) NOT NULL,
  price_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(commodity_id, price_date)
);

-- Enable RLS on all tables
ALTER TABLE public.commodity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commodity_prices ENABLE ROW LEVEL SECURITY;

-- Categories and commodities are public read
CREATE POLICY "Anyone can view commodity categories"
ON public.commodity_categories FOR SELECT
USING (true);

CREATE POLICY "Anyone can view commodities"
ON public.commodities FOR SELECT
USING (true);

CREATE POLICY "Anyone can view commodity prices"
ON public.commodity_prices FOR SELECT
USING (true);

-- Only authenticated users can insert/update prices
CREATE POLICY "Authenticated users can insert prices"
ON public.commodity_prices FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update prices"
ON public.commodity_prices FOR UPDATE
TO authenticated
USING (true);

-- Seed commodity categories
INSERT INTO public.commodity_categories (name, display_order) VALUES
  ('Meat', 1),
  ('Grains & Oilseeds', 2),
  ('Dairy & Eggs', 3),
  ('Wool & Hides', 4),
  ('Vegetables', 5);

-- Seed commodities
INSERT INTO public.commodities (category_id, name, unit)
SELECT c.id, commodity.name, commodity.unit
FROM public.commodity_categories c
CROSS JOIN LATERAL (
  SELECT * FROM (VALUES
    ('Meat', 'Beef (A2/A3 Carcass)', 'R/kg'),
    ('Meat', 'Mutton (A2/A3 Carcass)', 'R/kg'),
    ('Meat', 'Lamb (A2/A3 Carcass)', 'R/kg'),
    ('Meat', 'Pork (Baconer)', 'R/kg'),
    ('Meat', 'Chicken (Whole Frozen)', 'R/kg'),
    ('Grains & Oilseeds', 'Yellow Maize', 'R/ton'),
    ('Grains & Oilseeds', 'White Maize', 'R/ton'),
    ('Grains & Oilseeds', 'Wheat', 'R/ton'),
    ('Grains & Oilseeds', 'Sorghum', 'R/ton'),
    ('Grains & Oilseeds', 'Sunflower Seeds', 'R/ton'),
    ('Grains & Oilseeds', 'Soybeans', 'R/ton'),
    ('Dairy & Eggs', 'Fresh Milk', 'R/litre'),
    ('Dairy & Eggs', 'Eggs (Large)', 'R/dozen'),
    ('Dairy & Eggs', 'Butter', 'R/kg'),
    ('Dairy & Eggs', 'Cheese (Cheddar)', 'R/kg'),
    ('Wool & Hides', 'Wool (Merino)', 'R/kg'),
    ('Wool & Hides', 'Cattle Hides', 'R/hide'),
    ('Wool & Hides', 'Sheep Skins', 'R/skin'),
    ('Vegetables', 'Potatoes', 'R/10kg'),
    ('Vegetables', 'Onions', 'R/10kg'),
    ('Vegetables', 'Tomatoes', 'R/kg'),
    ('Vegetables', 'Cabbage', 'R/head')
  ) AS t(category_name, name, unit)
  WHERE t.category_name = c.name
) AS commodity;

-- Seed sample price data for the last 7 days
INSERT INTO public.commodity_prices (commodity_id, price, price_date, source)
SELECT 
  c.id,
  CASE 
    WHEN cat.name = 'Meat' AND c.name LIKE 'Beef%' THEN 65.50 + (random() * 5 - 2.5)
    WHEN cat.name = 'Meat' AND c.name LIKE 'Mutton%' THEN 95.00 + (random() * 8 - 4)
    WHEN cat.name = 'Meat' AND c.name LIKE 'Lamb%' THEN 110.00 + (random() * 10 - 5)
    WHEN cat.name = 'Meat' AND c.name LIKE 'Pork%' THEN 38.50 + (random() * 3 - 1.5)
    WHEN cat.name = 'Meat' AND c.name LIKE 'Chicken%' THEN 42.00 + (random() * 4 - 2)
    WHEN cat.name = 'Grains & Oilseeds' AND c.name LIKE 'Yellow Maize%' THEN 4850 + (random() * 200 - 100)
    WHEN cat.name = 'Grains & Oilseeds' AND c.name LIKE 'White Maize%' THEN 5100 + (random() * 200 - 100)
    WHEN cat.name = 'Grains & Oilseeds' AND c.name LIKE 'Wheat%' THEN 7200 + (random() * 300 - 150)
    WHEN cat.name = 'Grains & Oilseeds' AND c.name LIKE 'Sorghum%' THEN 4200 + (random() * 150 - 75)
    WHEN cat.name = 'Grains & Oilseeds' AND c.name LIKE 'Sunflower%' THEN 8500 + (random() * 400 - 200)
    WHEN cat.name = 'Grains & Oilseeds' AND c.name LIKE 'Soybeans%' THEN 9200 + (random() * 500 - 250)
    WHEN cat.name = 'Dairy & Eggs' AND c.name LIKE 'Fresh Milk%' THEN 18.50 + (random() * 2 - 1)
    WHEN cat.name = 'Dairy & Eggs' AND c.name LIKE 'Eggs%' THEN 52.00 + (random() * 6 - 3)
    WHEN cat.name = 'Dairy & Eggs' AND c.name LIKE 'Butter%' THEN 185.00 + (random() * 15 - 7.5)
    WHEN cat.name = 'Dairy & Eggs' AND c.name LIKE 'Cheese%' THEN 145.00 + (random() * 12 - 6)
    WHEN cat.name = 'Wool & Hides' AND c.name LIKE 'Wool%' THEN 185.00 + (random() * 20 - 10)
    WHEN cat.name = 'Wool & Hides' AND c.name LIKE 'Cattle%' THEN 450.00 + (random() * 50 - 25)
    WHEN cat.name = 'Wool & Hides' AND c.name LIKE 'Sheep%' THEN 85.00 + (random() * 10 - 5)
    WHEN cat.name = 'Vegetables' AND c.name LIKE 'Potatoes%' THEN 65.00 + (random() * 10 - 5)
    WHEN cat.name = 'Vegetables' AND c.name LIKE 'Onions%' THEN 45.00 + (random() * 8 - 4)
    WHEN cat.name = 'Vegetables' AND c.name LIKE 'Tomatoes%' THEN 28.00 + (random() * 5 - 2.5)
    WHEN cat.name = 'Vegetables' AND c.name LIKE 'Cabbage%' THEN 18.00 + (random() * 4 - 2)
    ELSE 50.00
  END,
  d.price_date,
  'Sample Data'
FROM public.commodities c
JOIN public.commodity_categories cat ON c.category_id = cat.id
CROSS JOIN (
  SELECT CURRENT_DATE - (generate_series(0, 6)) AS price_date
) d;

-- Create index for faster price lookups
CREATE INDEX idx_commodity_prices_date ON public.commodity_prices(price_date DESC);
CREATE INDEX idx_commodity_prices_commodity ON public.commodity_prices(commodity_id);