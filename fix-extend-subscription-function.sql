-- Fix the extend_subscription function to reset start_date to current date
-- Run this in Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS public.extend_subscription(UUID, INTEGER);

-- Create the corrected function
CREATE OR REPLACE FUNCTION public.extend_subscription(
  contractor_id UUID,
  additional_days INTEGER
)
RETURNS VOID AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set start_date to current date
  start_date := NOW();
  
  -- Set end_date to start_date + additional_days
  end_date := start_date + (additional_days || ' days')::INTERVAL;
  
  -- Update subscription with new start and end dates
  UPDATE public.profiles 
  SET 
    subscription_start_date = start_date,
    subscription_end_date = end_date,
    subscription_status = 'active',
    updated_on = NOW()
  WHERE id = contractor_id;
  
  -- Log the extension
  INSERT INTO public.system_logs (
    action,
    table_name,
    record_id,
    details,
    created_by
  ) VALUES (
    'subscription_extended',
    'profiles',
    contractor_id,
    json_build_object(
      'additional_days', additional_days,
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

-- Test the function
DO $$
DECLARE
  test_contractor_id UUID;
  result_count INTEGER;
BEGIN
  -- Get a contractor with subscription
  SELECT user_id INTO test_contractor_id 
  FROM public.contractors 
  WHERE is_deleted = false 
  LIMIT 1;
  
  -- Test the function
  IF test_contractor_id IS NOT NULL THEN
    PERFORM public.extend_subscription(test_contractor_id, 30);
    
    -- Check if the extension worked
    SELECT COUNT(*) INTO result_count
    FROM public.profiles 
    WHERE id = test_contractor_id 
    AND subscription_start_date IS NOT NULL
    AND subscription_end_date IS NOT NULL;
    
    IF result_count > 0 THEN
      RAISE NOTICE '✅ Test extension successful for contractor: %', test_contractor_id;
    ELSE
      RAISE NOTICE '❌ Test extension failed - no subscription data found';
    END IF;
  ELSE
    RAISE NOTICE '❌ No contractors found for testing';
  END IF;
END $$;

-- Show the result
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
