-- Simple fix for infinite recursion - only uses existing columns
-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL policies on parking_locations
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'parking_locations'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.parking_locations;', pol.policyname);
  END LOOP;
END $$;

-- Step 2: Drop ALL policies on contractors
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractors'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contractors;', pol.policyname);
  END LOOP;
END $$;

-- Step 3: Drop ALL policies on attendants
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendants'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.attendants;', pol.policyname);
  END LOOP;
END $$;

-- Step 4: Drop ALL policies on vehicles
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.vehicles;', pol.policyname);
  END LOOP;
END $$;

-- Step 5: Drop ALL policies on sessions
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sessions'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.sessions;', pol.policyname);
  END LOOP;
END $$;

-- Step 6: Ensure RLS is enabled on all tables
ALTER TABLE public.parking_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Step 7: Create SIMPLE policies using only existing columns

-- PARKING_LOCATIONS policies - Super admin can do everything
CREATE POLICY "super_admin_all_locations" ON public.parking_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- CONTRACTORS policies - Super admin can do everything
CREATE POLICY "super_admin_all_contractors" ON public.contractors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ATTENDANTS policies - Super admin can do everything
CREATE POLICY "super_admin_all_attendants" ON public.attendants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- VEHICLES policies - Super admin can do everything
CREATE POLICY "super_admin_all_vehicles" ON public.vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- SESSIONS policies - Super admin can do everything
CREATE POLICY "super_admin_all_sessions" ON public.sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Step 8: Test the fix
SELECT 'All policies fixed successfully!' as status;
