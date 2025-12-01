// Test script to verify attendant functionality
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAttendants() {
  try {
    console.log('🧪 Testing attendant functionality...');

    // Test 1: Check if we can query attendants
    console.log('\n1. Testing attendants query...');
    const { data: attendants, error: attendantsError } = await supabase
      .from('attendants')
      .select(`
        *,
        profiles:user_id (user_name, email, phone_number),
        parking_locations (
          locations_name,
          address,
          contractors (company_name)
        )
      `)
      .eq('is_deleted', false);

    if (attendantsError) {
      console.error('❌ Error querying attendants:', attendantsError);
    } else {
      console.log(`✅ Found ${attendants?.length || 0} attendants`);
      if (attendants && attendants.length > 0) {
        console.log('Sample attendant:', attendants[0]);
      }
    }

    // Test 2: Check contractors
    console.log('\n2. Testing contractors query...');
    const { data: contractors, error: contractorsError } = await supabase
      .from('contractors')
      .select(`
        *,
        profiles!inner(user_name, email, phone_number)
      `)
      .eq('is_deleted', false);

    if (contractorsError) {
      console.error('❌ Error querying contractors:', contractorsError);
    } else {
      console.log(`✅ Found ${contractors?.length || 0} contractors`);
    }

    // Test 3: Check locations
    console.log('\n3. Testing locations query...');
    const { data: locations, error: locationsError } = await supabase
      .from('parking_locations')
      .select(`
        *,
        contractors(company_name, user_id)
      `)
      .eq('is_deleted', false);

    if (locationsError) {
      console.error('❌ Error querying locations:', locationsError);
    } else {
      console.log(`✅ Found ${locations?.length || 0} locations`);
    }

    // Test 4: Create a test attendant if we have contractors
    if (contractors && contractors.length > 0) {
      console.log('\n4. Testing attendant creation...');
      
      const testAttendant = {
        user_name: 'Test Attendant',
        email: 'test.attendant@example.com',
        password: 'TestPassword123!',
        phone_number: '+1234567890',
        contractor_id: contractors[0].id,
        location_id: locations && locations.length > 0 ? locations[0].id : null
      };

      try {
        // First create the user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: testAttendant.email,
          password: testAttendant.password,
          options: {
            data: {
              user_name: testAttendant.user_name,
              role: 'attendant'
            }
          }
        });

        if (authError) {
          console.error('❌ Error creating user account:', authError);
        } else if (authData.user) {
          console.log('✅ User account created:', authData.user.email);

          // Update the profile
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              user_name: testAttendant.user_name,
              phone_number: testAttendant.phone_number,
              role: 'attendant',
              status: 'active',
              is_first_login: true
            })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error('❌ Error updating profile:', profileError);
          } else {
            console.log('✅ Profile updated');

            // Create the attendant record
            const { data: attendantData, error: attendantError } = await supabase
              .from('attendants')
              .insert({
                user_id: authData.user.id,
                location_id: testAttendant.location_id,
                status: 'active'
              })
              .select(`
                *,
                profiles:user_id (user_name, email, phone_number),
                parking_locations (
                  locations_name,
                  address,
                  contractors (company_name)
                )
              `)
              .single();

            if (attendantError) {
              console.error('❌ Error creating attendant record:', attendantError);
            } else {
              console.log('✅ Attendant record created:', attendantData);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error in attendant creation test:', error);
      }
    } else {
      console.log('⚠️ No contractors found. Cannot create test attendant.');
    }

    // Test 5: Test pagination
    console.log('\n5. Testing pagination...');
    const { data: paginatedAttendants, error: paginationError } = await supabase
      .from('attendants')
      .select(`
        *,
        profiles:user_id (user_name, email, phone_number),
        parking_locations (
          locations_name,
          address,
          contractors (company_name)
        )
      `, { count: 'exact' })
      .eq('is_deleted', false)
      .range(0, 4); // First 5 items

    if (paginationError) {
      console.error('❌ Error testing pagination:', paginationError);
    } else {
      console.log(`✅ Pagination test: Found ${paginatedAttendants?.length || 0} attendants on first page`);
    }

  } catch (error) {
    console.error('❌ Error in attendant test:', error);
  }
}

// Run the test
if (require.main === module) {
  testAttendants();
}

module.exports = { testAttendants };
