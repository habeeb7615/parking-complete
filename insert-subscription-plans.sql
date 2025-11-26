-- Insert subscription plans if they don't exist
-- Run this in Supabase SQL Editor

-- Check if subscription_plans table exists and has data
SELECT COUNT(*) as plan_count FROM public.subscription_plans WHERE is_deleted = false;

-- Insert subscription plans if table is empty
INSERT INTO public.subscription_plans (name, price, max_locations, max_attendants, features) 
SELECT * FROM (VALUES
  ('Basic', 99.00, 3, 5, '{"dashboard": true, "basic_analytics": true, "email_support": true}'),
  ('Standard', 199.00, 10, 20, '{"dashboard": true, "advanced_analytics": true, "email_support": true, "phone_support": true, "realtime_updates": true}'),
  ('Premium', 499.00, 50, 100, '{"dashboard": true, "advanced_analytics": true, "email_support": true, "phone_support": true, "realtime_updates": true, "custom_branding": true, "api_access": true, "priority_support": true}')
) AS t(name, price, max_locations, max_attendants, features)
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscription_plans WHERE is_deleted = false
);

-- Verify the insertion
SELECT id, name, price, max_locations, max_attendants FROM public.subscription_plans WHERE is_deleted = false ORDER BY price;
