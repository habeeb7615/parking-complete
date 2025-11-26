-- Fix the extend_subscription function to properly set start and end dates
-- When extending a subscription, set start_date to current time and end_date to start_date + extended days

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
  -- Set start_date to current time (when extension is made)
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
  
  -- Log the extension for audit trail
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
      'end_date', end_date,
      'extension_type', 'reset_start_date'
    ),
    contractor_id
  );
  
  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contractor with ID % not found', contractor_id;
  END IF;
  
  RAISE NOTICE 'Subscription extended for contractor %: start_date=%, end_date=%, additional_days=%', 
    contractor_id, start_date, end_date, additional_days;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function with a sample contractor
DO $$
DECLARE
  test_contractor_id UUID;
  result_count INTEGER;
  start_date_check TIMESTAMP WITH TIME ZONE;
  end_date_check TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get a contractor with subscription
  SELECT user_id INTO test_contractor_id 
  FROM public.contractors 
  WHERE is_deleted = false 
  LIMIT 1;
  
  -- Test the function if contractor exists
  IF test_contractor_id IS NOT NULL THEN
    -- Show current subscription data before extension
    SELECT subscription_start_date, subscription_end_date 
    INTO start_date_check, end_date_check
    FROM public.profiles 
    WHERE id = test_contractor_id;
    
    RAISE NOTICE 'Before extension - Start: %, End: %', start_date_check, end_date_check;
    
    -- Test the function
    PERFORM public.extend_subscription(test_contractor_id, 30);
    
    -- Check if the extension worked
    SELECT COUNT(*) INTO result_count
    FROM public.profiles 
    WHERE id = test_contractor_id 
    AND subscription_start_date IS NOT NULL
    AND subscription_end_date IS NOT NULL;
    
    -- Show updated subscription data
    SELECT subscription_start_date, subscription_end_date 
    INTO start_date_check, end_date_check
    FROM public.profiles 
    WHERE id = test_contractor_id;
    
    RAISE NOTICE 'After extension - Start: %, End: %', start_date_check, end_date_check;
    
    IF result_count > 0 THEN
      RAISE NOTICE '✅ Test extension successful for contractor: %', test_contractor_id;
    ELSE
      RAISE NOTICE '❌ Test extension failed - no subscription data found';
    END IF;
  ELSE
    RAISE NOTICE '❌ No contractors found for testing';
  END IF;
END $$;

-- Show the updated subscription data
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
