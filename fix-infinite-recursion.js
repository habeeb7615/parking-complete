// Fix infinite recursion in parking_locations policies
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixInfiniteRecursion() {
  try {
    console.log('🔧 Fixing infinite recursion in parking_locations policies...');

    // First, let's check what policies currently exist
    console.log('\n1. Checking current policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'parking_locations' });

    if (policiesError) {
      console.log('Using alternative method to check policies...');
    } else {
      console.log('Current policies:', policies);
    }

    // Drop all existing policies on parking_locations
    console.log('\n2. Dropping all existing policies on parking_locations...');
    const dropPoliciesSQL = `
      DO $$
      DECLARE pol RECORD;
      BEGIN
        FOR pol IN (
          SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'parking_locations'
        ) LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON public.parking_locations;', pol.policyname);
        END LOOP;
      END $$;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPoliciesSQL });
    if (dropError) {
      console.error('❌ Error dropping policies:', dropError);
    } else {
      console.log('✅ All existing policies dropped');
    }

    // Create new simple policies
    console.log('\n3. Creating new simple policies...');

    // Super admin policy
    const superAdminPolicy = `
      CREATE POLICY "super_admin_all_locations" ON public.parking_locations
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
          )
        );
    `;

    const { error: superAdminError } = await supabase.rpc('exec_sql', { sql: superAdminPolicy });
    if (superAdminError) {
      console.error('❌ Error creating super admin policy:', superAdminError);
    } else {
      console.log('✅ Super admin policy created');
    }

    // Contractor policy
    const contractorPolicy = `
      CREATE POLICY "contractor_manage_locations" ON public.parking_locations
        FOR ALL USING (
          contractor_id IN (
            SELECT id FROM public.contractors 
            WHERE user_id = auth.uid() AND is_deleted = false
          )
        );
    `;

    const { error: contractorError } = await supabase.rpc('exec_sql', { sql: contractorPolicy });
    if (contractorError) {
      console.error('❌ Error creating contractor policy:', contractorError);
    } else {
      console.log('✅ Contractor policy created');
    }

    // Attendant policy
    const attendantPolicy = `
      CREATE POLICY "attendant_view_locations" ON public.parking_locations
        FOR SELECT USING (
          id IN (
            SELECT location_id FROM public.attendants 
            WHERE user_id = auth.uid() AND is_deleted = false
          )
        );
    `;

    const { error: attendantError } = await supabase.rpc('exec_sql', { sql: attendantPolicy });
    if (attendantError) {
      console.error('❌ Error creating attendant policy:', attendantError);
    } else {
      console.log('✅ Attendant policy created');
    }

    // Test the fix
    console.log('\n4. Testing the fix...');
    const { data: testData, error: testError } = await supabase
      .from('parking_locations')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log('✅ Test successful! No more infinite recursion.');
      console.log('Found', testData?.length || 0, 'locations');
    }

  } catch (error) {
    console.error('❌ Error fixing infinite recursion:', error);
  }
}

// Alternative method using direct SQL execution
async function fixWithDirectSQL() {
  try {
    console.log('🔧 Using direct SQL method...');

    const fixSQL = `
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

      -- Create simple, non-recursive policies
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
    `;

    // This would need to be run in the Supabase SQL editor
    console.log('📋 Copy and paste this SQL into your Supabase SQL editor:');
    console.log('=' .repeat(80));
    console.log(fixSQL);
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
if (require.main === module) {
  console.log('Choose a method:');
  console.log('1. Try RPC method (if available)');
  console.log('2. Get SQL to run manually');
  
  // Try RPC method first
  fixInfiniteRecursion().then(() => {
    console.log('\nIf the RPC method failed, use the manual SQL method below:');
    fixWithDirectSQL();
  });
}

export { fixInfiniteRecursion, fixWithDirectSQL };
