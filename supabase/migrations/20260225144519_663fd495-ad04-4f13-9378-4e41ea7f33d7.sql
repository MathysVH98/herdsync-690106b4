-- Add removal tracking columns to livestock table
ALTER TABLE public.livestock 
  ADD COLUMN removed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN removal_reason TEXT DEFAULT NULL;

-- Add a comment for clarity
COMMENT ON COLUMN public.livestock.removal_reason IS 'Reason for removal: Dead, Stolen, Lost, Donated, Other';
