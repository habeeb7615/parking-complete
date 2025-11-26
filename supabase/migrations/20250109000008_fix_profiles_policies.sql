-- Fix profiles table policies to resolve 406 errors
-- The issue is that get_user_role() function creates circular dependency

-- First, drop all existing policies on profiles table
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles;', pol.policyname);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for profiles table
-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow profile creation during registration (for triggers and app code)
CREATE POLICY "profiles_insert_registration" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Super admins can view all profiles (using direct role check instead of function)
CREATE POLICY "profiles_select_super_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Super admins can manage all profiles
CREATE POLICY "profiles_manage_super_admin" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Also fix the get_user_role function to handle cases where profile doesn't exist
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'unknown'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;
