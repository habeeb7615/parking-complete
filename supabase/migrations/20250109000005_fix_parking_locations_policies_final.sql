-- Final fix for parking_locations infinite recursion
-- This migration addresses the specific infinite recursion error

-- Drop all existing policies on parking_locations to eliminate conflicts
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

-- Create simple, non-recursive policies for parking_locations
-- Super admin can do everything
CREATE POLICY "parking_locations_super_admin_all" ON public.parking_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Contractors can manage their own locations
CREATE POLICY "parking_locations_contractor_manage" ON public.parking_locations
  FOR ALL USING (
    contractor_id IN (
      SELECT id FROM public.contractors 
      WHERE user_id = auth.uid()
    )
  );

-- Attendants can view their assigned locations
CREATE POLICY "parking_locations_attendant_view" ON public.parking_locations
  FOR SELECT USING (
    id IN (
      SELECT location_id FROM public.attendants 
      WHERE user_id = auth.uid()
    )
  );

-- Also fix similar issues in other tables
-- Drop and recreate contractors policies
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

CREATE POLICY "contractors_super_admin_all" ON public.contractors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "contractors_own_data" ON public.contractors
  FOR ALL USING (user_id = auth.uid());

-- Drop and recreate attendants policies
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

CREATE POLICY "attendants_super_admin_all" ON public.attendants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "attendants_contractor_manage" ON public.attendants
  FOR ALL USING (
    location_id IN (
      SELECT id FROM public.parking_locations 
      WHERE contractor_id IN (
        SELECT id FROM public.contractors WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "attendants_own_data" ON public.attendants
  FOR SELECT USING (user_id = auth.uid());

-- Drop and recreate vehicles policies
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

CREATE POLICY "vehicles_super_admin_view" ON public.vehicles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "vehicles_contractor_view" ON public.vehicles
  FOR SELECT USING (
    contractor_id IN (
      SELECT id FROM public.contractors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "vehicles_attendant_manage" ON public.vehicles
  FOR ALL USING (
    location_id IN (
      SELECT location_id FROM public.attendants WHERE user_id = auth.uid()
    )
  );

-- Drop and recreate sessions policies
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sessions'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.sessions;', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_super_admin_view" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "sessions_contractor_view" ON public.sessions
  FOR SELECT USING (
    location_id IN (
      SELECT id FROM public.parking_locations 
      WHERE contractor_id IN (
        SELECT id FROM public.contractors WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "sessions_attendant_manage" ON public.sessions
  FOR ALL USING (
    location_id IN (
      SELECT location_id FROM public.attendants WHERE user_id = auth.uid()
    )
  );
