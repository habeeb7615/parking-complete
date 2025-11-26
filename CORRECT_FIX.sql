-- Correct fix for infinite recursion - works with current table structure
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

-- Step 7: Create SIMPLE policies that work with current structure

-- PARKING_LOCATIONS policies (check if contractor_id exists first)
DO $$
BEGIN
  -- Check if contractor_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parking_locations' 
    AND column_name = 'contractor_id' 
    AND table_schema = 'public'
  ) THEN
    -- Create policies with contractor_id
    EXECUTE 'CREATE POLICY "super_admin_all_locations" ON public.parking_locations
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND role = ''super_admin''
        )
      )';
    
    EXECUTE 'CREATE POLICY "contractor_manage_locations" ON public.parking_locations
      FOR ALL USING (
        contractor_id IN (
          SELECT id FROM public.contractors 
          WHERE user_id = auth.uid() AND is_deleted = false
        )
      )';
  ELSE
    -- Create policies without contractor_id
    EXECUTE 'CREATE POLICY "super_admin_all_locations" ON public.parking_locations
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND role = ''super_admin''
        )
      )';
    
    EXECUTE 'CREATE POLICY "contractor_manage_locations" ON public.parking_locations
      FOR ALL USING (
        created_by = auth.uid()
      )';
  END IF;
END $$;

-- Attendants can view their assigned locations
CREATE POLICY "attendant_view_locations" ON public.parking_locations
  FOR SELECT USING (
    id IN (
      SELECT location_id FROM public.attendants 
      WHERE user_id = auth.uid() AND is_deleted = false
    )
  );

-- CONTRACTORS policies
CREATE POLICY "super_admin_all_contractors" ON public.contractors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "contractor_manage_self" ON public.contractors
  FOR ALL USING (user_id = auth.uid());

-- ATTENDANTS policies
CREATE POLICY "super_admin_all_attendants" ON public.attendants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "attendant_manage_self" ON public.attendants
  FOR ALL USING (user_id = auth.uid());

-- VEHICLES policies
CREATE POLICY "super_admin_all_vehicles" ON public.vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Check if contractor_id exists in vehicles table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' 
    AND column_name = 'contractor_id' 
    AND table_schema = 'public'
  ) THEN
    EXECUTE 'CREATE POLICY "contractor_manage_vehicles" ON public.vehicles
      FOR ALL USING (
        contractor_id IN (
          SELECT id FROM public.contractors 
          WHERE user_id = auth.uid() AND is_deleted = false
        )
      )';
  ELSE
    EXECUTE 'CREATE POLICY "contractor_manage_vehicles" ON public.vehicles
      FOR ALL USING (
        created_by = auth.uid()
      )';
  END IF;
END $$;

CREATE POLICY "attendant_manage_vehicles" ON public.vehicles
  FOR ALL USING (
    location_id IN (
      SELECT location_id FROM public.attendants 
      WHERE user_id = auth.uid() AND is_deleted = false
    )
  );

-- SESSIONS policies
CREATE POLICY "super_admin_all_sessions" ON public.sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Check if contractor_id exists in sessions table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'contractor_id' 
    AND table_schema = 'public'
  ) THEN
    EXECUTE 'CREATE POLICY "contractor_manage_sessions" ON public.sessions
      FOR ALL USING (
        contractor_id IN (
          SELECT id FROM public.contractors 
          WHERE user_id = auth.uid() AND is_deleted = false
        )
      )';
  ELSE
    EXECUTE 'CREATE POLICY "contractor_manage_sessions" ON public.sessions
      FOR ALL USING (
        created_by = auth.uid()
      )';
  END IF;
END $$;

CREATE POLICY "attendant_manage_sessions" ON public.sessions
  FOR ALL USING (
    attendant_id IN (
      SELECT id FROM public.attendants 
      WHERE user_id = auth.uid() AND is_deleted = false
    )
  );

-- Step 8: Test the fix
SELECT 'All policies fixed successfully!' as status;
