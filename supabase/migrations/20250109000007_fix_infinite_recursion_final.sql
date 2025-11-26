-- Fix infinite recursion in parking_locations policies
-- This migration will clean up all conflicting policies and create simple, non-recursive ones

-- First, drop ALL existing policies on parking_locations
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'parking_locations'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.parking_locations;', pol.policyname);
  END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.parking_locations ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

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

-- Also clean up other tables that might have similar issues

-- Drop all policies on contractors
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

CREATE POLICY "super_admin_all_contractors" ON public.contractors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "contractor_manage_self" ON public.contractors
  FOR ALL USING (user_id = auth.uid());

-- Drop all policies on attendants
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendants'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.attendants;', pol.policyname);
  END LOOP;
END $$;

-- Recreate attendants policies
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

-- Drop all policies on vehicles
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.vehicles;', pol.policyname);
  END LOOP;
END $$;

-- Recreate vehicles policies
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

-- Drop all policies on sessions
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sessions'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.sessions;', pol.policyname);
  END LOOP;
END $$;

-- Recreate sessions policies
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_sessions" ON public.sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "contractor_manage_sessions" ON public.sessions
  FOR ALL USING (
    contractor_id IN (
      SELECT id FROM public.contractors 
      WHERE user_id = auth.uid() AND is_deleted = false
    )
  );

CREATE POLICY "attendant_manage_sessions" ON public.sessions
  FOR ALL USING (
    attendant_id IN (
      SELECT id FROM public.attendants 
      WHERE user_id = auth.uid() AND is_deleted = false
    )
  );
