-- Simple payment tracking setup
-- Run this in Supabase SQL Editor

-- First, check if payments table exists and create it if not
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id VARCHAR(255),
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

-- Create subscription_history table
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  action VARCHAR(50) NOT NULL,
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payments_contractor_id ON public.payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_created_on ON public.payments(created_on);

CREATE INDEX IF NOT EXISTS idx_subscription_history_contractor_id ON public.subscription_history(contractor_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_action ON public.subscription_history(action);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_on ON public.subscription_history(created_on);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Super admin can view all payments" ON public.payments;
CREATE POLICY "Super admin can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super admin can view all subscription history" ON public.subscription_history;
CREATE POLICY "Super admin can view all subscription history" ON public.subscription_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Contractors can view their own payments" ON public.payments;
CREATE POLICY "Contractors can view their own payments" ON public.payments
  FOR SELECT USING (
    contractor_id IN (
      SELECT id FROM public.contractors 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Contractors can view their own subscription history" ON public.subscription_history;
CREATE POLICY "Contractors can view their own subscription history" ON public.subscription_history
  FOR SELECT USING (
    contractor_id IN (
      SELECT id FROM public.contractors 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Super admin can insert payments" ON public.payments;
CREATE POLICY "Super admin can insert payments" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super admin can insert subscription history" ON public.subscription_history;
CREATE POLICY "Super admin can insert subscription history" ON public.subscription_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Test the tables
SELECT 'Payments table created successfully' as status;
SELECT 'Subscription history table created successfully' as status;
