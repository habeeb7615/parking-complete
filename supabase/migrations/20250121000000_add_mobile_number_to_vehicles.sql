-- Add mobile_number column to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN mobile_number VARCHAR(20);
