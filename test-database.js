import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bvpdjeknzhclpriisfeh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2cGRqZWtuemhjbHByaWlzZmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjUwNzYsImV4cCI6MjA3Mjc0MTA3Nn0.Bv7ye97wldyhhxvjCC8VidkdrIZFi0Xsu8Fq42fSka8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('Testing database connection...');
  
  try {
    // Test contractors table
    console.log('\n1. Testing contractors table...');
    const { data: contractors, error: contractorsError } = await supabase
      .from('contractors')
      .select('*')
      .limit(1);
    
    if (contractorsError) {
      console.error('❌ Contractors table error:', contractorsError.message);
    } else {
      console.log('✅ Contractors table accessible');
    }

    // Test parking_locations table
    console.log('\n2. Testing parking_locations table...');
    const { data: locations, error: locationsError } = await supabase
      .from('parking_locations')
      .select('*')
      .limit(1);
    
    if (locationsError) {
      console.error('❌ Parking locations table error:', locationsError.message);
    } else {
      console.log('✅ Parking locations table accessible');
    }

    // Test attendants table
    console.log('\n3. Testing attendants table...');
    const { data: attendants, error: attendantsError } = await supabase
      .from('attendants')
      .select('*')
      .limit(1);
    
    if (attendantsError) {
      console.error('❌ Attendants table error:', attendantsError.message);
    } else {
      console.log('✅ Attendants table accessible');
    }

    // Test vehicles table
    console.log('\n4. Testing vehicles table...');
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .limit(1);
    
    if (vehiclesError) {
      console.error('❌ Vehicles table error:', vehiclesError.message);
    } else {
      console.log('✅ Vehicles table accessible');
    }

    // Test payments table
    console.log('\n5. Testing payments table...');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(1);
    
    if (paymentsError) {
      console.error('❌ Payments table error:', paymentsError.message);
    } else {
      console.log('✅ Payments table accessible');
    }

    console.log('\n🎉 Database test completed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();
