-- Drop the existing foreign key constraint that references 'animals' table
ALTER TABLE public.animal_sale_items 
DROP CONSTRAINT IF EXISTS animal_sale_items_animal_id_fkey;

-- Add new foreign key constraint referencing 'livestock' table
ALTER TABLE public.animal_sale_items 
ADD CONSTRAINT animal_sale_items_animal_id_fkey 
FOREIGN KEY (animal_id) REFERENCES public.livestock(id) ON DELETE CASCADE;