// Script to check database state and apply fixes
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixDatabase() {
  try {
    console.log('🔍 Checking database state...');

    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ Error getting user:', userError);
      return;
    }
    console.log('✅ Current user:', user?.email);

    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Error getting profile:', profileError);
      return;
    }
    console.log('✅ User profile:', profile);

    // Test parking_locations query
    console.log('\n🔍 Testing parking_locations query...');
    const { data: locations, error: locationsError } = await supabase
      .from('parking_locations')
      .select('*')
      .eq('is_deleted', false);

    if (locationsError) {
      console.error('❌ Error querying parking_locations:', locationsError);
      
      // If it's a policy error, try to apply the manual fix
      if (locationsError.message.includes('infinite recursion') || locationsError.message.includes('policy')) {
        console.log('\n🔧 Applying manual policy fix...');
        await applyManualFix();
      }
    } else {
      console.log(`✅ Found ${locations?.length || 0} parking locations`);
      if (locations && locations.length > 0) {
        console.log('Sample location:', locations[0]);
      } else {
        console.log('📝 No locations found. Creating test data...');
        await createTestData();
      }
    }

    // Test contractors query
    console.log('\n🔍 Testing contractors query...');
    const { data: contractors, error: contractorsError } = await supabase
      .from('contractors')
      .select('*')
      .eq('is_deleted', false);

    if (contractorsError) {
      console.error('❌ Error querying contractors:', contractorsError);
    } else {
      console.log(`✅ Found ${contractors?.length || 0} contractors`);
    }

  } catch (error) {
    console.error('❌ Error in check:', error);
  }
}

async function applyManualFix() {
  try {
    console.log('🔧 Applying manual policy fix...');
    
    // Drop all policies on parking_locations
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
      return;
    }
    console.log('✅ Dropped existing policies');

    // Create new simple policies
    const createPoliciesSQL = `
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
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPoliciesSQL });
    if (createError) {
      console.error('❌ Error creating policies:', createError);
      return;
    }
    console.log('✅ Created new policies');

  } catch (error) {
    console.error('❌ Error applying fix:', error);
  }
}

async function createTestData() {
  try {
    console.log('📝 Creating test data...');
    
    // Create a test contractor first
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .insert({
        company_name: 'Test Parking Company',
        contact_number: '+1234567890',
        status: 'active',
        allowed_locations: 5,
        allowed_attendants_per_location: 10,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (contractorError) {
      console.error('❌ Error creating contractor:', contractorError);
      return;
    }
    console.log('✅ Created test contractor:', contractor.id);

    // Create test parking locations
    const { data: locations, error: locationsError } = await supabase
      .from('parking_locations')
      .insert([
        {
          locations_name: 'Downtown Parking Plaza',
          address: '123 Main Street',
          city: 'New York',
          state: 'NY',
          pincode: '10001',
          status: 'active',
          contractor_id: contractor.id,
          total_slots: 50,
          occupied_slots: 12
        },
        {
          locations_name: 'Shopping Mall Parking',
          address: '456 Commerce Ave',
          city: 'New York',
          state: 'NY',
          pincode: '10002',
          status: 'active',
          contractor_id: contractor.id,
          total_slots: 100,
          occupied_slots: 45
        }
      ])
      .select();

    if (locationsError) {
      console.error('❌ Error creating locations:', locationsError);
      return;
    }
    console.log(`✅ Created ${locations?.length || 0} test locations`);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

// Run the check and fix
if (require.main === module) {
  checkAndFixDatabase();
}

module.exports = { checkAndFixDatabase, applyManualFix, createTestData };
