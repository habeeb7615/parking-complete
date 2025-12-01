-- Fix RLS policies for subscription_plans table
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can manage subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "All users can view subscription plans" ON public.subscription_plans;

-- Create new policies that allow anonymous access for reading
CREATE POLICY "Allow anonymous read access to subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Allow super admin full access to subscription plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'subscription_plans';
