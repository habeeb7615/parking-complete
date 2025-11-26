const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubscriptionData() {
  console.log('🔍 Testing subscription data...\n');

  try {
    // Test subscription plans
    console.log('1. Checking subscription plans...');
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_deleted', false);

    if (plansError) {
      console.error('❌ Error fetching plans:', plansError);
    } else {
      console.log(`✅ Found ${plans?.length || 0} subscription plans:`);
      plans?.forEach(plan => {
        console.log(`   - ${plan.name}: $${plan.price}`);
      });
    }

    // Test contractors
    console.log('\n2. Checking contractors...');
    const { data: contractors, error: contractorsError } = await supabase
      .from('contractors')
      .select(`
        id,
        company_name,
        status,
        profiles:user_id (
          user_name,
          email
        )
      `)
      .eq('is_deleted', false);

    if (contractorsError) {
      console.error('❌ Error fetching contractors:', contractorsError);
    } else {
      console.log(`✅ Found ${contractors?.length || 0} contractors:`);
      contractors?.forEach(contractor => {
        console.log(`   - ${contractor.company_name} (${contractor.profiles?.user_name || contractor.profiles?.email})`);
      });
    }

    // Test profiles with subscription data
    console.log('\n3. Checking profiles with subscription data...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_name,
        email,
        role,
        subscription_plan_id,
        subscription_start_date,
        subscription_end_date,
        subscription_status
      `)
      .eq('role', 'contractor')
      .eq('is_deleted', false);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`✅ Found ${profiles?.length || 0} contractor profiles:`);
      profiles?.forEach(profile => {
        console.log(`   - ${profile.user_name} (${profile.email})`);
        console.log(`     Plan ID: ${profile.subscription_plan_id || 'None'}`);
        console.log(`     Status: ${profile.subscription_status || 'None'}`);
        console.log(`     Start: ${profile.subscription_start_date || 'None'}`);
        console.log(`     End: ${profile.subscription_end_date || 'None'}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testSubscriptionData();
