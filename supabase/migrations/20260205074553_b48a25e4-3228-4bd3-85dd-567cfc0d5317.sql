-- Add receipt_image_url column to farm_expenses table
ALTER TABLE public.farm_expenses 
ADD COLUMN IF NOT EXISTS receipt_image_url TEXT;

-- Create storage bucket for expense receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to expense-receipts bucket
CREATE POLICY "Users can upload expense receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-receipts');

-- Allow authenticated users to view expense receipts
CREATE POLICY "Users can view expense receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'expense-receipts');

-- Allow authenticated users to delete their expense receipts
CREATE POLICY "Users can delete expense receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'expense-receipts');