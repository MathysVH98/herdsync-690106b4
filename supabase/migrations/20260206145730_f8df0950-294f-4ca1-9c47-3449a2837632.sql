-- Add planned_sale_date column to livestock table for "Mark for Sale" feature
ALTER TABLE public.livestock 
ADD COLUMN planned_sale_date date NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.livestock.planned_sale_date IS 'Date when the animal is planned to be sold. Used for feeding program alerts and countdown timers.';