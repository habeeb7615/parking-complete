-- Fix RLS policies for all tables
-- This migration fixes RLS policies to allow proper access

-- Drop all existing policies
DO $$
DECLARE pol RECORD;
BEGIN
  -- Drop contractors policies
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contractors'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contractors;', pol.policyname);
  END LOOP;
  
  -- Drop parking_locations policies
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'parking_locations'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.parking_locations;', pol.policyname);
  END LOOP;
  
  -- Drop attendants policies
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendants'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.attendants;', pol.policyname);
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

-- Recreate parking_locations policies
ALTER TABLE public.parking_locations ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "locations_super_admin_all" ON public.parking_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Contractors can manage their locations
CREATE POLICY "locations_contractor_manage" ON public.parking_locations
  FOR ALL USING (
    contractor_id IN (
      SELECT id FROM public.contractors WHERE user_id = auth.uid()
    )
  );

-- Attendants can view their assigned locations
CREATE POLICY "locations_attendant_view" ON public.parking_locations
  FOR SELECT USING (
    id IN (
      SELECT location_id FROM public.attendants WHERE user_id = auth.uid()
    )
  );

-- Recreate attendants policies
ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "attendants_super_admin_all" ON public.attendants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Contractors can manage attendants in their locations
CREATE POLICY "attendants_contractor_manage" ON public.attendants
  FOR ALL USING (
    location_id IN (
      SELECT id FROM public.parking_locations 
      WHERE contractor_id IN (
        SELECT id FROM public.contractors WHERE user_id = auth.uid()
      )
    )
  );

-- Attendants can view their own data
CREATE POLICY "attendants_own_data" ON public.attendants
  FOR SELECT USING (user_id = auth.uid());

-- Test the policies
-- This is just a comment - the actual test will be done by the application
