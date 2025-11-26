-- Create subscription_plans table if it doesn't exist
-- Run this in Supabase SQL Editor

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  max_locations INTEGER NOT NULL,
  max_attendants INTEGER NOT NULL,
  features JSONB DEFAULT '{}',
  created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Super admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY IF NOT EXISTS "All users can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

-- Insert sample subscription plans
INSERT INTO public.subscription_plans (name, price, max_locations, max_attendants, features) VALUES
('Basic', 99.00, 3, 5, '{"dashboard": true, "basic_analytics": true, "email_support": true}'),
('Standard', 199.00, 10, 20, '{"dashboard": true, "advanced_analytics": true, "email_support": true, "phone_support": true, "realtime_updates": true}'),
('Premium', 499.00, 50, 100, '{"dashboard": true, "advanced_analytics": true, "email_support": true, "phone_support": true, "realtime_updates": true, "custom_branding": true, "api_access": true, "priority_support": true}')
ON CONFLICT (name) DO NOTHING;

-- Verify the data
SELECT id, name, price, max_locations, max_attendants FROM public.subscription_plans WHERE is_deleted = false ORDER BY price;
