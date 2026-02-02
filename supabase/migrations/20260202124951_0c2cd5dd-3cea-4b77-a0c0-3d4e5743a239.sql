-- Add financial and sales tracking columns to livestock
ALTER TABLE public.livestock
ADD COLUMN purchase_cost numeric DEFAULT 0,
ADD COLUMN sale_price numeric DEFAULT NULL,
ADD COLUMN sold_at timestamp with time zone DEFAULT NULL,
ADD COLUMN sold_to text DEFAULT NULL;

-- Create index for filtering sold vs active animals
CREATE INDEX idx_livestock_sold_at ON public.livestock(sold_at);
