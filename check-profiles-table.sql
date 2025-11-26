-- Check if profiles table has subscription columns
-- Run this in Supabase SQL Editor

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name LIKE '%subscription%'
ORDER BY column_name;

-- Check if subscription_plan_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name = 'subscription_plan_id';

-- If subscription_plan_id doesn't exist, add it
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id);

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('subscription_plan_id', 'subscription_start_date', 'subscription_end_date', 'subscription_status');
