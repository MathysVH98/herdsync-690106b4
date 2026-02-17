
-- Add additional beef grades
INSERT INTO public.commodities (name, unit, category_id) VALUES
  ('Beef (B2/B3 Carcass)', 'R/kg', '094fd5a5-e4d3-4f25-80af-5b1192471e94'),
  ('Beef (C2/C3 Carcass)', 'R/kg', '094fd5a5-e4d3-4f25-80af-5b1192471e94'),
  ('Weaner Calf (Bulls)', 'R/kg', '094fd5a5-e4d3-4f25-80af-5b1192471e94'),
  -- Add additional mutton grades
  ('Mutton (B2/B3 Carcass)', 'R/kg', '094fd5a5-e4d3-4f25-80af-5b1192471e94'),
  ('Mutton (C2/C3 Carcass)', 'R/kg', '094fd5a5-e4d3-4f25-80af-5b1192471e94'),
  ('Feeder Lamb', 'R/kg', '094fd5a5-e4d3-4f25-80af-5b1192471e94'),
  -- Add Porkers (Baconer already exists)
  ('Pork (Porker)', 'R/kg', '094fd5a5-e4d3-4f25-80af-5b1192471e94');
