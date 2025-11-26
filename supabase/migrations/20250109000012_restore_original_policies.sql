-- Restore original RLS policies for all tables
-- This migration restores the policies that were working before

-- ==============================================
-- PROFILES TABLE POLICIES
-- ==============================================

-- Drop existing policies on profiles table
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles;', pol.policyname);
  END LOOP;
END $$;

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "profiles_own_data" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_own_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_super_admin_view" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "profiles_super_admin_manage" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- ==============================================
-- CONTRACTORS TABLE POLICIES
-- ==============================================

-- Drop existing policies on contractors table
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractors'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contractors;', pol.policyname);
  END LOOP;
END $$;

-- Enable RLS on contractors table
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

-- Create contractors policies
CREATE POLICY "contractors_own_data" ON public.contractors
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "contractors_super_admin_all" ON public.contractors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- ==============================================
-- PARKING_LOCATIONS TABLE POLICIES
-- ==============================================

-- Drop existing policies on parking_locations table
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'parking_locations'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.parking_locations;', pol.policyname);
  END LOOP;
END $$;

-- Enable RLS on parking_locations table
ALTER TABLE public.parking_locations ENABLE ROW LEVEL SECURITY;

-- Create parking_locations policies
CREATE POLICY "locations_contractor_view" ON public.parking_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contractors c
      WHERE c.id = contractor_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "locations_contractor_insert" ON public.parking_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contractors c
      WHERE c.id = contractor_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "locations_contractor_update" ON public.parking_locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.contractors c
      WHERE c.id = contractor_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "locations_super_admin_all" ON public.parking_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- ==============================================
-- ATTENDANTS TABLE POLICIES
-- ==============================================

-- Drop existing policies on attendants table
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendants'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.attendants;', pol.policyname);
  END LOOP;
END $$;

-- Enable RLS on attendants table
ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;

-- Create attendants policies
CREATE POLICY "attendants_contractor_view" ON public.attendants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parking_locations pl
      JOIN public.contractors c ON c.id = pl.contractor_id
      WHERE pl.id = location_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "attendants_contractor_insert" ON public.attendants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parking_locations pl
      JOIN public.contractors c ON c.id = pl.contractor_id
      WHERE pl.id = location_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "attendants_contractor_update" ON public.attendants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.parking_locations pl
      JOIN public.contractors c ON c.id = pl.contractor_id
      WHERE pl.id = location_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "attendants_super_admin_all" ON public.attendants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- ==============================================
-- VEHICLES TABLE POLICIES
-- ==============================================

-- Drop existing policies on vehicles table
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.vehicles;', pol.policyname);
  END LOOP;
END $$;

-- Enable RLS on vehicles table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create vehicles policies
CREATE POLICY "vehicles_contractor_view" ON public.vehicles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contractors c
      WHERE c.id = contractor_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "vehicles_contractor_insert" ON public.vehicles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contractors c
      WHERE c.id = contractor_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "vehicles_contractor_update" ON public.vehicles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.contractors c
      WHERE c.id = contractor_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "vehicles_super_admin_all" ON public.vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- ==============================================
-- SESSIONS TABLE POLICIES
-- ==============================================

-- Drop existing policies on sessions table
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sessions'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.sessions;', pol.policyname);
  END LOOP;
END $$;

-- Enable RLS on sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create sessions policies
CREATE POLICY "sessions_contractor_view" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parking_locations pl
      JOIN public.contractors c ON c.id = pl.contractor_id
      WHERE pl.id = location_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "sessions_contractor_insert" ON public.sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.parking_locations pl
      JOIN public.contractors c ON c.id = pl.contractor_id
      WHERE pl.id = location_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "sessions_contractor_update" ON public.sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.parking_locations pl
      JOIN public.contractors c ON c.id = pl.contractor_id
      WHERE pl.id = location_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "sessions_super_admin_all" ON public.sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Test the policies
-- This is just a comment - the actual test will be done by the application
