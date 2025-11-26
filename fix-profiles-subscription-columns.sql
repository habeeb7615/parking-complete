-- Fix profiles table to include all subscription columns
-- Run this in Supabase SQL Editor

-- Add missing subscription_plan_id column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id);

-- Verify all subscription columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('subscription_plan_id', 'subscription_start_date', 'subscription_end_date', 'subscription_status')
ORDER BY column_name;

-- Test the assign_subscription function with a real contractor
-- Replace 'YOUR_CONTRACTOR_USER_ID' with an actual contractor user ID
DO $$
DECLARE
  test_contractor_id UUID;
  test_plan_id UUID;
BEGIN
  -- Get a contractor user ID
  SELECT user_id INTO test_contractor_id 
  FROM public.contractors 
  WHERE is_deleted = false 
  LIMIT 1;
  
  -- Get a subscription plan ID
  SELECT id INTO test_plan_id 
  FROM public.subscription_plans 
  WHERE is_deleted = false 
  LIMIT 1;
  
  -- Test the function
  IF test_contractor_id IS NOT NULL AND test_plan_id IS NOT NULL THEN
    PERFORM public.assign_subscription(test_contractor_id, test_plan_id, 30);
    RAISE NOTICE 'Test assignment completed for contractor: %', test_contractor_id;
  ELSE
    RAISE NOTICE 'No contractors or plans found for testing';
  END IF;
END $$;

-- Check the result
SELECT 
  id,
  user_name,
  subscription_plan_id,
  subscription_start_date,
  subscription_end_date,
  subscription_status
FROM public.profiles 
WHERE subscription_plan_id IS NOT NULL
ORDER BY updated_on DESC
LIMIT 5;
