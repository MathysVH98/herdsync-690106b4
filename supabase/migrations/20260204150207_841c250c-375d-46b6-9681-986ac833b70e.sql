-- Add animal_id column to feeding_schedule table to make it animal-specific
ALTER TABLE public.feeding_schedule ADD COLUMN animal_id uuid REFERENCES public.livestock(id) ON DELETE CASCADE;

-- Make animal_type nullable since we now use animal_id
ALTER TABLE public.feeding_schedule ALTER COLUMN animal_type DROP NOT NULL;

-- Create index for better performance
CREATE INDEX idx_feeding_schedule_animal_id ON public.feeding_schedule(animal_id);