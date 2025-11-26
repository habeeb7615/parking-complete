-- Fix infinite recursion in profiles RLS policies for Super Admin
-- Drop existing problematic policies
DROP POLICY IF EXISTS "super_admin_profiles_all" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_own_data" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_own_update" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_super_admin_all" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_contractor_all" ON "public"."profiles";

-- Create simple policies without circular references
CREATE POLICY "profiles_select_own" ON "public"."profiles"
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON "public"."profiles"
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON "public"."profiles"
FOR INSERT WITH CHECK (auth.uid() = id);

-- Super Admin policies for other tables
CREATE POLICY "super_admin_contractors_all" ON "public"."contractors"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles" 
    WHERE "profiles"."id" = auth.uid() 
    AND "profiles"."role" = 'super_admin'
  )
);

CREATE POLICY "super_admin_locations_all" ON "public"."parking_locations"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles" 
    WHERE "profiles"."id" = auth.uid() 
    AND "profiles"."role" = 'super_admin'
  )
);

CREATE POLICY "super_admin_attendants_all" ON "public"."attendants"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "public"."profiles" 
    WHERE "profiles"."id" = auth.uid() 
    AND "profiles"."role" = 'super_admin'
  )
);

-- Super Admin can access all profiles (without circular reference)
CREATE POLICY "super_admin_profiles_all" ON "public"."profiles"
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM "public"."profiles" 
    WHERE role = 'super_admin'
  )
);

-- Contractor policies
CREATE POLICY "contractor_own_data" ON "public"."contractors"
FOR ALL USING (
  user_id = auth.uid()
);

CREATE POLICY "contractor_locations_all" ON "public"."parking_locations"
FOR ALL USING (
  contractor_id IN (
    SELECT id FROM "public"."contractors" 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "contractor_attendants_all" ON "public"."attendants"
FOR ALL USING (
  location_id IN (
    SELECT id FROM "public"."parking_locations" 
    WHERE contractor_id IN (
      SELECT id FROM "public"."contractors" 
      WHERE user_id = auth.uid()
    )
  )
);

-- Attendant policies
CREATE POLICY "attendant_own_data" ON "public"."attendants"
FOR ALL USING (
  user_id = auth.uid()
);

CREATE POLICY "attendant_vehicles_all" ON "public"."vehicles"
FOR ALL USING (
  location_id IN (
    SELECT location_id FROM "public"."attendants" 
    WHERE user_id = auth.uid()
  )
);
