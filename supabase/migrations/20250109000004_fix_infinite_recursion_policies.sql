-- Fix infinite recursion in RLS policies by dropping all conflicting policies and recreating them properly

-- First, let's check what tables actually exist and their structure
-- Drop all existing policies on all tables to avoid conflicts

-- Drop all policies on parking_locations
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'parking_locations'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.parking_locations;', pol.policyname);
  END LOOP;
END $$;

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

-- Ensure RLS is enabled on all tables
ALTER TABLE public.parking_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create a simple function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for parking_locations
-- Super admin can do everything
CREATE POLICY "super_admin_all_parking_locations" ON public.parking_locations
  FOR ALL USING (public.is_super_admin());

-- Contractors can manage their own locations
CREATE POLICY "contractors_manage_locations" ON public.parking_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.contractors c
      WHERE c.id = parking_locations.contractor_id 
      AND c.user_id = auth.uid()
    )
  );

-- Attendants can view their assigned locations
CREATE POLICY "attendants_view_locations" ON public.parking_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.attendants a
      WHERE a.location_id = parking_locations.id 
      AND a.user_id = auth.uid()
    )
  );

-- Create policies for contractors
-- Super admin can do everything
CREATE POLICY "super_admin_all_contractors" ON public.contractors
  FOR ALL USING (public.is_super_admin());

-- Contractors can view and update their own data
CREATE POLICY "contractors_own_data" ON public.contractors
  FOR ALL USING (user_id = auth.uid());

-- Create policies for attendants
-- Super admin can do everything
CREATE POLICY "super_admin_all_attendants" ON public.attendants
  FOR ALL USING (public.is_super_admin());

-- Contractors can manage attendants in their locations
CREATE POLICY "contractors_manage_attendants" ON public.attendants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.parking_locations pl
      JOIN public.contractors c ON pl.contractor_id = c.id
      WHERE pl.id = attendants.location_id 
      AND c.user_id = auth.uid()
    )
  );

-- Attendants can view their own data
CREATE POLICY "attendants_own_data" ON public.attendants
  FOR SELECT USING (user_id = auth.uid());

-- Create policies for vehicles
-- Super admin can view all vehicles
CREATE POLICY "super_admin_view_vehicles" ON public.vehicles
  FOR SELECT USING (public.is_super_admin());

-- Contractors can view vehicles in their locations
CREATE POLICY "contractors_view_vehicles" ON public.vehicles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parking_locations pl
      JOIN public.contractors c ON pl.contractor_id = c.id
      WHERE pl.id = vehicles.location_id 
      AND c.user_id = auth.uid()
    )
  );

-- Attendants can manage vehicles in their location
CREATE POLICY "attendants_manage_vehicles" ON public.vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.attendants a
      WHERE a.location_id = vehicles.location_id 
      AND a.user_id = auth.uid()
    )
  );

-- Create policies for sessions
-- Super admin can view all sessions
CREATE POLICY "super_admin_view_sessions" ON public.sessions
  FOR SELECT USING (public.is_super_admin());

-- Contractors can view sessions in their locations
CREATE POLICY "contractors_view_sessions" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parking_locations pl
      JOIN public.contractors c ON pl.contractor_id = c.id
      WHERE pl.id = sessions.location_id 
      AND c.user_id = auth.uid()
    )
  );

-- Attendants can manage sessions in their location
CREATE POLICY "attendants_manage_sessions" ON public.sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.attendants a
      WHERE a.location_id = sessions.location_id 
      AND a.user_id = auth.uid()
    )
  );
