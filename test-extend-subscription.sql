-- Test script to verify extend_subscription function works correctly
-- Run this in Supabase SQL Editor after applying the migration

-- First, let's see current subscription data
SELECT 
  id,
  user_name,
  subscription_start_date,
  subscription_end_date,
  subscription_status,
  updated_on
FROM public.profiles 
WHERE subscription_start_date IS NOT NULL
ORDER BY updated_on DESC
LIMIT 5;

-- Test the extend_subscription function
DO $$
DECLARE
  test_contractor_id UUID;
  start_date_before TIMESTAMP WITH TIME ZONE;
  end_date_before TIMESTAMP WITH TIME ZONE;
  start_date_after TIMESTAMP WITH TIME ZONE;
  end_date_after TIMESTAMP WITH TIME ZONE;
  current_time_check TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current time for comparison
  current_time_check := NOW();
  
  -- Get a contractor with subscription
  SELECT user_id INTO test_contractor_id 
  FROM public.contractors 
  WHERE is_deleted = false 
  LIMIT 1;
  
  IF test_contractor_id IS NOT NULL THEN
    -- Get current subscription dates
    SELECT subscription_start_date, subscription_end_date 
    INTO start_date_before, end_date_before
    FROM public.profiles 
    WHERE id = test_contractor_id;
    
    RAISE NOTICE 'Before extension:';
    RAISE NOTICE '  Start: %', start_date_before;
    RAISE NOTICE '  End: %', end_date_before;
    RAISE NOTICE '  Current time: %', current_time_check;
    
    -- Test the function with 30 days extension
    PERFORM public.extend_subscription(test_contractor_id, 30);
    
    -- Get updated subscription dates
    SELECT subscription_start_date, subscription_end_date 
    INTO start_date_after, end_date_after
    FROM public.profiles 
    WHERE id = test_contractor_id;
    
    RAISE NOTICE 'After extension:';
    RAISE NOTICE '  Start: %', start_date_after;
    RAISE NOTICE '  End: %', end_date_after;
    
    -- Verify the dates are correct
    IF start_date_after >= current_time_check AND end_date_after > start_date_after THEN
      RAISE NOTICE '✅ Test PASSED: Subscription dates are correctly set';
    ELSE
      RAISE NOTICE '❌ Test FAILED: Subscription dates are incorrect';
    END IF;
    
  ELSE
    RAISE NOTICE '❌ No contractors found for testing';
  END IF;
END $$;

-- Show final subscription data
SELECT 
  id,
  user_name,
  subscription_start_date,
  subscription_end_date,
  subscription_status,
  updated_on
FROM public.profiles 
WHERE subscription_start_date IS NOT NULL
ORDER BY updated_on DESC
LIMIT 5;
