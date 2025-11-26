-- Add contractor_id column to attendants table
ALTER TABLE public.attendants 
ADD COLUMN contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_attendants_contractor_id ON public.attendants(contractor_id);

-- Update existing attendants to have contractor_id based on their location
UPDATE public.attendants 
SET contractor_id = pl.contractor_id
FROM public.parking_locations pl
WHERE attendants.location_id = pl.id
AND attendants.contractor_id IS NULL;
