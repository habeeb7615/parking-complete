-- Fix the assign_subscription function completely
-- Run this in Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS public.assign_subscription(UUID, UUID, INTEGER);

-- Create the corrected function (only updates profiles table)
CREATE OR REPLACE FUNCTION public.assign_subscription(
  contractor_id UUID,
  plan_id UUID,
  duration_days INTEGER DEFAULT 30
)
RETURNS VOID AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  start_date := NOW();
  end_date := start_date + (duration_days || ' days')::INTERVAL;
  
  -- Update contractor profile with subscription (ONLY in profiles table)
  UPDATE public.profiles 
  SET 
    subscription_plan_id = plan_id,
    subscription_start_date = start_date,
    subscription_end_date = end_date,
    subscription_status = 'active',
    updated_on = NOW()
  WHERE id = contractor_id;
  
  -- Log the assignment for audit trail
  INSERT INTO public.system_logs (
    action,
    table_name,
    record_id,
    details,
    created_by
  ) VALUES (
    'subscription_assigned',
    'profiles',
    contractor_id,
    json_build_object(
      'plan_id', plan_id,
      'duration_days', duration_days,
      'start_date', start_date,
      'end_date', end_date
    ),
    contractor_id
  );
  
  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contractor with ID % not found', contractor_id;
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function with a real contractor
DO $$
DECLARE
  test_contractor_id UUID;
  test_plan_id UUID;
  result_count INTEGER;
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
    
    -- Check if the assignment worked
    SELECT COUNT(*) INTO result_count
    FROM public.profiles 
    WHERE id = test_contractor_id 
    AND subscription_plan_id = test_plan_id;
    
    IF result_count > 0 THEN
      RAISE NOTICE '✅ Test assignment successful for contractor: %', test_contractor_id;
    ELSE
      RAISE NOTICE '❌ Test assignment failed - no subscription data found';
    END IF;
  ELSE
    RAISE NOTICE '❌ No contractors or plans found for testing';
  END IF;
END $$;

-- Show the result
SELECT 
  id,
  user_name,
  subscription_plan_id,
  subscription_start_date,
  subscription_end_date,
  subscription_status,
  updated_on
FROM public.profiles 
WHERE subscription_plan_id IS NOT NULL
ORDER BY updated_on DESC
LIMIT 5;
