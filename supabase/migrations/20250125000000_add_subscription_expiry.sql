-- Add subscription expiry fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'suspended'));

-- Create function to check subscription validity
CREATE OR REPLACE FUNCTION public.check_subscription_validity(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Get user profile with subscription details
  SELECT 
    subscription_start_date,
    subscription_end_date,
    subscription_status,
    role
  INTO user_profile
  FROM public.profiles 
  WHERE id = user_id;
  
  -- Super admin always has access
  IF user_profile.role = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- If no subscription dates, check if user has subscription_plan_id
  IF user_profile.subscription_start_date IS NULL OR user_profile.subscription_end_date IS NULL THEN
    -- Check if user has a subscription plan assigned
    SELECT subscription_plan_id INTO user_profile.subscription_plan_id
    FROM public.profiles 
    WHERE id = user_id;
    
    -- If no subscription plan, deny access
    IF user_profile.subscription_plan_id IS NULL THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check if subscription is expired
  IF user_profile.subscription_end_date IS NOT NULL AND user_profile.subscription_end_date < NOW() THEN
    -- Update subscription status to expired
    UPDATE public.profiles 
    SET subscription_status = 'expired'
    WHERE id = user_id;
    
    RETURN FALSE;
  END IF;
  
  -- Check subscription status
  IF user_profile.subscription_status = 'expired' OR user_profile.subscription_status = 'suspended' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign subscription to contractor
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
  
  -- Update contractor profile with subscription
  UPDATE public.profiles 
  SET 
    subscription_plan_id = plan_id,
    subscription_start_date = start_date,
    subscription_end_date = end_date,
    subscription_status = 'active',
    updated_on = NOW()
  WHERE id = contractor_id;
  
  -- Also update contractor record if exists
  UPDATE public.contractors 
  SET 
    subscription_plan_id = plan_id,
    updated_on = NOW()
  WHERE user_id = contractor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to extend subscription
CREATE OR REPLACE FUNCTION public.extend_subscription(
  contractor_id UUID,
  additional_days INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_end_date TIMESTAMP WITH TIME ZONE;
  new_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current end date
  SELECT subscription_end_date INTO current_end_date
  FROM public.profiles 
  WHERE id = contractor_id;
  
  -- If no current subscription, start from now
  IF current_end_date IS NULL THEN
    current_end_date := NOW();
  END IF;
  
  -- Extend subscription
  new_end_date := current_end_date + (additional_days || ' days')::INTERVAL;
  
  -- Update subscription
  UPDATE public.profiles 
  SET 
    subscription_end_date = new_end_date,
    subscription_status = 'active',
    updated_on = NOW()
  WHERE id = contractor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy to check subscription validity
CREATE POLICY "Check subscription validity for contractors" ON public.profiles
  FOR SELECT USING (
    public.check_subscription_validity(auth.uid()) = true OR 
    public.get_user_role() = 'super_admin'
  );

-- Update existing RLS policies to include subscription check
DROP POLICY IF EXISTS "Contractors can view their own data" ON public.contractors;
CREATE POLICY "Contractors can view their own data" ON public.contractors
  FOR SELECT USING (
    user_id = auth.uid() AND 
    public.check_subscription_validity(auth.uid()) = true
  );

DROP POLICY IF EXISTS "Contractors can update their own data" ON public.contractors;
CREATE POLICY "Contractors can update their own data" ON public.contractors
  FOR UPDATE USING (
    user_id = auth.uid() AND 
    public.check_subscription_validity(auth.uid()) = true
  );

-- Add subscription check to parking locations
DROP POLICY IF EXISTS "Contractors can view their locations" ON public.parking_locations;
CREATE POLICY "Contractors can view their locations" ON public.parking_locations
  FOR SELECT USING (
    contractor_id IN (
      SELECT id FROM public.contractors 
      WHERE user_id = auth.uid() AND 
      public.check_subscription_validity(auth.uid()) = true
    )
  );

-- Add subscription check to attendants
DROP POLICY IF EXISTS "Contractors can view their attendants" ON public.attendants;
CREATE POLICY "Contractors can view their attendants" ON public.attendants
  FOR SELECT USING (
    contractor_id IN (
      SELECT id FROM public.contractors 
      WHERE user_id = auth.uid() AND 
      public.check_subscription_validity(auth.uid()) = true
    )
  );

-- Add subscription check to vehicles
DROP POLICY IF EXISTS "Contractors can view their vehicles" ON public.vehicles;
CREATE POLICY "Contractors can view their vehicles" ON public.vehicles
  FOR SELECT USING (
    contractor_id IN (
      SELECT id FROM public.contractors 
      WHERE user_id = auth.uid() AND 
      public.check_subscription_validity(auth.uid()) = true
    )
  );
