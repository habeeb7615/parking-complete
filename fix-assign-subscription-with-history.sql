-- Fix assign_subscription function to include subscription history
-- Run this in Supabase SQL Editor

-- Drop the existing function
DROP FUNCTION IF EXISTS public.assign_subscription(UUID, UUID, INTEGER);

-- Create the updated function with subscription history
CREATE OR REPLACE FUNCTION public.assign_subscription(
  contractor_id UUID,
  plan_id UUID,
  duration_days INTEGER DEFAULT 30
)
RETURNS VOID AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
  plan_price DECIMAL(10,2);
  payment_id UUID;
BEGIN
  start_date := NOW();
  end_date := start_date + (duration_days || ' days')::INTERVAL;
  
  -- Get plan price
  SELECT price INTO plan_price FROM public.subscription_plans WHERE id = plan_id;
  
  -- Create payment record
  INSERT INTO public.payments (
    contractor_id,
    subscription_plan_id,
    amount,
    payment_method,
    payment_status,
    subscription_start_date,
    subscription_end_date,
    duration_days,
    created_by
  ) VALUES (
    contractor_id,
    plan_id,
    plan_price,
    'assigned',
    'completed',
    start_date,
    end_date,
    duration_days,
    auth.uid()
  ) RETURNING id INTO payment_id;
  
  -- Update contractor profile with subscription
  UPDATE public.profiles 
  SET 
    subscription_plan_id = plan_id,
    subscription_start_date = start_date,
    subscription_end_date = end_date,
    subscription_status = 'active',
    updated_on = NOW()
  WHERE id = contractor_id;
  
  -- Record in subscription history
  INSERT INTO public.subscription_history (
    contractor_id,
    subscription_plan_id,
    action,
    new_start_date,
    new_end_date,
    duration_days,
    amount_paid,
    payment_id,
    created_by
  ) VALUES (
    contractor_id,
    plan_id,
    'assigned',
    start_date,
    end_date,
    duration_days,
    plan_price,
    payment_id,
    auth.uid()
  );
  
  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contractor with ID % not found', contractor_id;
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update extend_subscription function to include history
CREATE OR REPLACE FUNCTION public.extend_subscription(
  contractor_id UUID,
  additional_days INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_end_date TIMESTAMP WITH TIME ZONE;
  new_end_date TIMESTAMP WITH TIME ZONE;
  current_plan_id UUID;
  plan_price DECIMAL(10,2);
  payment_id UUID;
BEGIN
  -- Get current subscription details
  SELECT subscription_end_date, subscription_plan_id 
  INTO current_end_date, current_plan_id
  FROM public.profiles 
  WHERE id = contractor_id;
  
  -- If no current subscription, start from now
  IF current_end_date IS NULL THEN
    current_end_date := NOW();
  END IF;
  
  -- Get plan price
  SELECT price INTO plan_price FROM public.subscription_plans WHERE id = current_plan_id;
  
  -- Extend subscription
  new_end_date := current_end_date + (additional_days || ' days')::INTERVAL;
  
  -- Create payment record for extension
  INSERT INTO public.payments (
    contractor_id,
    subscription_plan_id,
    amount,
    payment_method,
    payment_status,
    subscription_start_date,
    subscription_end_date,
    duration_days,
    created_by
  ) VALUES (
    contractor_id,
    current_plan_id,
    plan_price,
    'extended',
    'completed',
    current_end_date,
    new_end_date,
    additional_days,
    auth.uid()
  ) RETURNING id INTO payment_id;
  
  -- Update subscription
  UPDATE public.profiles 
  SET 
    subscription_end_date = new_end_date,
    subscription_status = 'active',
    updated_on = NOW()
  WHERE id = contractor_id;
  
  -- Record in subscription history
  INSERT INTO public.subscription_history (
    contractor_id,
    subscription_plan_id,
    action,
    previous_start_date,
    previous_end_date,
    new_start_date,
    new_end_date,
    duration_days,
    amount_paid,
    payment_id,
    created_by
  ) VALUES (
    contractor_id,
    current_plan_id,
    'extended',
    current_end_date,
    current_end_date,
    current_end_date,
    new_end_date,
    additional_days,
    plan_price,
    payment_id,
    auth.uid()
  );
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the functions
SELECT 'Functions updated successfully' as status;
