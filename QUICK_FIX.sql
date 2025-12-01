-- Quick fix for infinite recursion
-- Run this in Supabase SQL Editor

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

-- Create simple policies
CREATE POLICY "super_admin_all_locations" ON public.parking_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "contractor_manage_locations" ON public.parking_locations
  FOR ALL USING (
    contractor_id IN (
      SELECT id FROM public.contractors 
      WHERE user_id = auth.uid() AND is_deleted = false
    )
  );

CREATE POLICY "attendant_view_locations" ON public.parking_locations
  FOR SELECT USING (
    id IN (
      SELECT location_id FROM public.attendants 
      WHERE user_id = auth.uid() AND is_deleted = false
    )
  );

-- Test
SELECT 'Fixed!' as status;
