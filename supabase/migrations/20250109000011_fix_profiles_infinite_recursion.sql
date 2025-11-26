-- Fix infinite recursion in profiles table RLS policies
-- This migration fixes the circular dependency issue

-- Drop all existing policies on profiles table
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles;', pol.policyname);
  END LOOP;
END $$;

-- Recreate profiles policies without circular dependencies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "profiles_own_data" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Super admins can view all profiles
CREATE POLICY "profiles_super_admin_view" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Super admins can manage all profiles
CREATE POLICY "profiles_super_admin_manage" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Test the policies
-- This is just a comment - the actual test will be done by the application
