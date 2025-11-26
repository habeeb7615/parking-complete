-- Fix extend_subscription function to reset start_date to current time
-- This ensures that when extending a subscription, both start and end dates are properly set

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
  
  -- Log the extension for audit trail (simplified)
  -- Note: system_logs table may not exist, so we'll just log via RAISE NOTICE
  
  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contractor with ID % not found', contractor_id;
  END IF;
  
  RAISE NOTICE 'Subscription extended for contractor %: start_date=%, end_date=%, additional_days=%', 
    contractor_id, start_date, end_date, additional_days;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
