-- Fix contractors table RLS policies
-- This migration fixes the contractors table policies to allow proper access

-- Drop all existing policies on contractors table
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractors'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contractors;', pol.policyname);
  END LOOP;
END $$;

-- Recreate contractors policies
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "contractors_super_admin_all" ON public.contractors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Contractors can view and update their own data
CREATE POLICY "contractors_own_data" ON public.contractors
  FOR ALL USING (user_id = auth.uid());

-- Allow contractors to insert their own data (for self-registration)
CREATE POLICY "contractors_self_insert" ON public.contractors
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Test the policies by checking if contractor can access their data
-- This is just a comment - the actual test will be done by the application
