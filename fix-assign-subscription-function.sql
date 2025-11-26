-- Fix the assign_subscription function to only update profiles table
-- Run this in Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS public.assign_subscription(UUID, UUID, INTEGER);

-- Create the corrected function
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
  
  -- Update contractor profile with subscription (only in profiles table)
  UPDATE public.profiles 
  SET 
    subscription_plan_id = plan_id,
    subscription_start_date = start_date,
    subscription_end_date = end_date,
    subscription_status = 'active',
    updated_on = NOW()
  WHERE id = contractor_id;
  
  -- Log the assignment
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT public.assign_subscription(
  '00000000-0000-0000-0000-000000000002', -- Test contractor ID
  (SELECT id FROM public.subscription_plans WHERE name = 'Basic' LIMIT 1),
  30
);
