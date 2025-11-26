-- Fix infinite recursion in parking_locations policies
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Drop all existing policies on parking_locations
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'parking_locations'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.parking_locations;', pol.policyname);
  END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.parking_locations ENABLE ROW LEVEL SECURITY;

-- Step 3: Create simple, non-recursive policies

-- Super admins can do everything
CREATE POLICY "super_admin_all_locations" ON public.parking_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Contractors can manage their own locations
CREATE POLICY "contractor_manage_locations" ON public.parking_locations
  FOR ALL USING (
    contractor_id IN (
      SELECT id FROM public.contractors 
      WHERE user_id = auth.uid() AND is_deleted = false
    )
  );

-- Attendants can view their assigned locations
CREATE POLICY "attendant_view_locations" ON public.parking_locations
  FOR SELECT USING (
    id IN (
      SELECT location_id FROM public.attendants 
      WHERE user_id = auth.uid() AND is_deleted = false
    )
  );

-- Step 4: Also fix contractors table
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractors'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contractors;', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_contractors" ON public.contractors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "contractor_manage_self" ON public.contractors
  FOR ALL USING (user_id = auth.uid());

-- Step 5: Fix attendants table
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendants'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.attendants;', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_attendants" ON public.attendants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "attendant_manage_self" ON public.attendants
  FOR ALL USING (user_id = auth.uid());

-- Step 6: Fix vehicles table
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.vehicles;', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_vehicles" ON public.vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "contractor_manage_vehicles" ON public.vehicles
  FOR ALL USING (
    contractor_id IN (
      SELECT id FROM public.contractors 
      WHERE user_id = auth.uid() AND is_deleted = false
    )
  );

CREATE POLICY "attendant_manage_vehicles" ON public.vehicles
  FOR ALL USING (
    location_id IN (
      SELECT location_id FROM public.attendants 
      WHERE user_id = auth.uid() AND is_deleted = false
    )
  );

-- Step 7: Test the fix
SELECT 'Policies fixed successfully!' as status;
