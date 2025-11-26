-- Add payment tracking and purchase history tables
-- This migration adds comprehensive payment and subscription tracking

-- Create payments table for tracking all payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50) NOT NULL, -- 'cash', 'card', 'digital', 'bank_transfer'
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id VARCHAR(255), -- External payment gateway transaction ID
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  subscription_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_days INTEGER NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false
);

-- Create subscription_history table for tracking all subscription changes
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  action VARCHAR(50) NOT NULL, -- 'assigned', 'extended', 'cancelled', 'renewed'
  previous_plan_id UUID REFERENCES public.subscription_plans(id),
  previous_start_date TIMESTAMP WITH TIME ZONE,
  previous_end_date TIMESTAMP WITH TIME ZONE,
  new_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  new_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_days INTEGER NOT NULL,
  amount_paid DECIMAL(10,2),
  payment_id UUID REFERENCES public.payments(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_payments_contractor_id ON public.payments(contractor_id);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX idx_payments_status ON public.payments(payment_status);
CREATE INDEX idx_payments_created_on ON public.payments(created_on);

CREATE INDEX idx_subscription_history_contractor_id ON public.subscription_history(contractor_id);
CREATE INDEX idx_subscription_history_action ON public.subscription_history(action);
CREATE INDEX idx_subscription_history_created_on ON public.subscription_history(created_on);

-- Add RLS policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Super admin can view all payments and history
CREATE POLICY "Super admin can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can view all subscription history" ON public.subscription_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Contractors can view their own payments and history
CREATE POLICY "Contractors can view their own payments" ON public.payments
  FOR SELECT USING (
    contractor_id IN (
      SELECT id FROM public.contractors 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can view their own subscription history" ON public.subscription_history
  FOR SELECT USING (
    contractor_id IN (
      SELECT id FROM public.contractors 
      WHERE user_id = auth.uid()
    )
  );

-- Super admin can insert payments and history
CREATE POLICY "Super admin can insert payments" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can insert subscription history" ON public.subscription_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Update assign_subscription function to record in history
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
  
  -- Also update contractor record if exists
  UPDATE public.contractors 
  SET 
    subscription_plan_id = plan_id,
    updated_on = NOW()
  WHERE user_id = contractor_id;
  
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update extend_subscription function to record in history
CREATE OR REPLACE FUNCTION public.extend_subscription(
  contractor_id UUID,
  additional_days INTEGER
)
RETURNS VOID AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
  current_plan_id UUID;
  plan_price DECIMAL(10,2);
  payment_id UUID;
  previous_start_date TIMESTAMP WITH TIME ZONE;
  previous_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  start_date := NOW();
  end_date := start_date + (additional_days || ' days')::INTERVAL;
  
  -- Get current subscription details
  SELECT 
    subscription_plan_id,
    subscription_start_date,
    subscription_end_date
  INTO current_plan_id, previous_start_date, previous_end_date
  FROM public.profiles 
  WHERE id = contractor_id;
  
  -- Get plan price
  SELECT price INTO plan_price FROM public.subscription_plans WHERE id = current_plan_id;
  
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
    start_date,
    end_date,
    additional_days,
    auth.uid()
  ) RETURNING id INTO payment_id;
  
  -- Update subscription with new start and end dates
  UPDATE public.profiles 
  SET 
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
    previous_plan_id,
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
    current_plan_id,
    previous_start_date,
    previous_end_date,
    start_date,
    end_date,
    additional_days,
    plan_price,
    payment_id,
    auth.uid()
  );
  
  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contractor with ID % not found', contractor_id;
  END IF;
  
  RAISE NOTICE 'Subscription extended for contractor %: start_date=%, end_date=%, additional_days=%', 
    contractor_id, start_date, end_date, additional_days;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
