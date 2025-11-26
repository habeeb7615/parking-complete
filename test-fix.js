// Simple test to check if infinite recursion is fixed
import { createClient } from '@supabase/supabase-js';

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFix() {
  try {
    console.log('🧪 Testing if infinite recursion is fixed...');
    
    // Test 1: Try to query parking_locations
    console.log('\n1. Testing parking_locations query...');
    const { data: locations, error: locationsError } = await supabase
      .from('parking_locations')
      .select('*')
      .limit(1);

    if (locationsError) {
      console.error('❌ Still getting error:', locationsError);
      if (locationsError.message.includes('infinite recursion')) {
        console.log('🔧 You need to run the SQL fix in Supabase dashboard');
        console.log('📋 Copy the contents of QUICK_FIX.sql and run it in Supabase SQL Editor');
      }
    } else {
      console.log('✅ Parking locations query successful!');
      console.log('Found', locations?.length || 0, 'locations');
    }

    // Test 2: Try to query attendants
    console.log('\n2. Testing attendants query...');
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
      .eq('is_deleted', false)
      .limit(1);

    if (attendantsError) {
      console.error('❌ Attendants query error:', attendantsError);
    } else {
      console.log('✅ Attendants query successful!');
      console.log('Found', attendants?.length || 0, 'attendants');
    }

    // Test 3: Try to query contractors
    console.log('\n3. Testing contractors query...');
    const { data: contractors, error: contractorsError } = await supabase
      .from('contractors')
      .select('*')
      .eq('is_deleted', false)
      .limit(1);

    if (contractorsError) {
      console.error('❌ Contractors query error:', contractorsError);
    } else {
      console.log('✅ Contractors query successful!');
      console.log('Found', contractors?.length || 0, 'contractors');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testFix();
}

export { testFix };
