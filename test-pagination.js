// Test script to verify pagination functionality
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPagination() {
  try {
    console.log('🧪 Testing pagination functionality...');

    // Test 1: Basic pagination
    console.log('\n1. Testing basic pagination...');
    const { data: page1, error: page1Error } = await supabase
      .from('parking_locations')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .range(0, 4); // First 5 items

    if (page1Error) {
      console.error('❌ Error testing page 1:', page1Error);
    } else {
      console.log(`✅ Page 1: Found ${page1?.length || 0} items`);
    }

    // Test 2: Search functionality
    console.log('\n2. Testing search functionality...');
    const { data: searchResults, error: searchError } = await supabase
      .from('parking_locations')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .or('locations_name.ilike.%downtown%,address.ilike.%downtown%');

    if (searchError) {
      console.error('❌ Error testing search:', searchError);
    } else {
      console.log(`✅ Search results: Found ${searchResults?.length || 0} items`);
    }

    // Test 3: Sorting
    console.log('\n3. Testing sorting...');
    const { data: sortedResults, error: sortError } = await supabase
      .from('parking_locations')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('locations_name', { ascending: true });

    if (sortError) {
      console.error('❌ Error testing sort:', sortError);
    } else {
      console.log(`✅ Sorted results: Found ${sortedResults?.length || 0} items`);
      if (sortedResults && sortedResults.length > 0) {
        console.log('First item:', sortedResults[0].locations_name);
      }
    }

    // Test 4: Count total items
    console.log('\n4. Testing total count...');
    const { count, error: countError } = await supabase
      .from('parking_locations')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    if (countError) {
      console.error('❌ Error getting count:', countError);
    } else {
      console.log(`✅ Total locations: ${count || 0}`);
      
      if (count > 0) {
        const totalPages = Math.ceil(count / 10);
        console.log(`✅ Total pages (10 per page): ${totalPages}`);
      }
    }

    // Test 5: Create more test data if needed
    if (!count || count < 15) {
      console.log('\n5. Creating additional test data...');
      await createMoreTestData();
    }

  } catch (error) {
    console.error('❌ Error in pagination test:', error);
  }
}

async function createMoreTestData() {
  try {
    // Get a contractor to use
    const { data: contractors } = await supabase
      .from('contractors')
      .select('id')
      .eq('is_deleted', false)
      .limit(1);

    if (!contractors || contractors.length === 0) {
      console.log('No contractors found. Cannot create test data.');
      return;
    }

    const contractorId = contractors[0].id;
    const testLocations = [];

    // Create 20 test locations
    for (let i = 1; i <= 20; i++) {
      testLocations.push({
        locations_name: `Test Location ${i}`,
        address: `${i * 100} Test Street, Test City`,
        city: 'Test City',
        state: 'TS',
        pincode: `${10000 + i}`,
        status: 'active',
        contractor_id: contractorId,
        total_slots: Math.floor(Math.random() * 100) + 10,
        occupied_slots: Math.floor(Math.random() * 50)
      });
    }

    const { data, error } = await supabase
      .from('parking_locations')
      .insert(testLocations);

    if (error) {
      console.error('❌ Error creating test data:', error);
    } else {
      console.log(`✅ Created ${testLocations.length} test locations`);
    }

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

// Run the test
if (require.main === module) {
  testPagination();
}

module.exports = { testPagination, createMoreTestData };
