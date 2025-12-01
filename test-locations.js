// Test script to check parking locations data and policies
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLocations() {
  try {
    console.log('Testing parking locations access...');

    // Test 1: Check if we can query parking_locations directly
    console.log('\n1. Testing direct parking_locations query...');
    const { data: locations, error: locationsError } = await supabase
      .from('parking_locations')
      .select('*')
      .eq('is_deleted', false);

    if (locationsError) {
      console.error('Error querying parking_locations:', locationsError);
    } else {
      console.log(`Found ${locations?.length || 0} parking locations`);
      if (locations && locations.length > 0) {
        console.log('Sample location:', locations[0]);
      }
    }

    // Test 2: Check contractors
    console.log('\n2. Testing contractors query...');
    const { data: contractors, error: contractorsError } = await supabase
      .from('contractors')
      .select('*')
      .eq('is_deleted', false);

    if (contractorsError) {
      console.error('Error querying contractors:', contractorsError);
    } else {
      console.log(`Found ${contractors?.length || 0} contractors`);
    }

    // Test 3: Check profiles
    console.log('\n3. Testing profiles query...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_deleted', false);

    if (profilesError) {
      console.error('Error querying profiles:', profilesError);
    } else {
      console.log(`Found ${profiles?.length || 0} profiles`);
    }

    // Test 4: Check current user
    console.log('\n4. Testing current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error getting user:', userError);
    } else {
      console.log('Current user:', user?.email);
    }

    // Test 5: Check user profile
    if (user) {
      console.log('\n5. Testing user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error getting profile:', profileError);
      } else {
        console.log('User profile:', profile);
      }
    }

    // Test 6: Try to create a test location (if no locations exist)
    if (!locations || locations.length === 0) {
      console.log('\n6. No locations found. Creating a test location...');
      
      // First, let's see if we have any contractors
      if (contractors && contractors.length > 0) {
        const testLocation = {
          locations_name: 'Test Parking Location',
          address: '123 Test Street, Test City',
          total_slots: 10,
          contractor_id: contractors[0].id,
          created_by: user?.id
        };

        const { data: newLocation, error: createError } = await supabase
          .from('parking_locations')
          .insert(testLocation)
          .select()
          .single();

        if (createError) {
          console.error('Error creating test location:', createError);
        } else {
          console.log('Test location created:', newLocation);
        }
      } else {
        console.log('No contractors found. Cannot create test location.');
      }
    }

  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
if (require.main === module) {
  testLocations();
}

module.exports = { testLocations };
