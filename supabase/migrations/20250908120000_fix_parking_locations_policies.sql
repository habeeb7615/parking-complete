-- Fix recursive RLS by replacing complex policies on parking_locations with simple, role-based ones

-- Drop all existing policies on parking_locations
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

-- Allow super admins to select any rows
CREATE POLICY "parking_locations_select_super_admin" ON public.parking_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Allow super admins to insert rows
CREATE POLICY "parking_locations_insert_super_admin" ON public.parking_locations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Allow super admins to update rows
CREATE POLICY "parking_locations_update_super_admin" ON public.parking_locations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Allow super admins to delete rows
CREATE POLICY "parking_locations_delete_super_admin" ON public.parking_locations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );


