const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSubscriptionPlans() {
  console.log('🚀 Inserting subscription plans...\n');

  try {
    // Check if plans already exist
    const { data: existingPlans, error: checkError } = await supabase
      .from('subscription_plans')
      .select('*');

    if (checkError) {
      console.error('Error checking existing plans:', checkError);
      return;
    }

    if (existingPlans && existingPlans.length > 0) {
      console.log('✅ Subscription plans already exist:');
      existingPlans.forEach(plan => {
        console.log(`   - ${plan.name}: $${plan.price} (${plan.max_locations} locations, ${plan.max_attendants} attendants)`);
      });
      return;
    }

    // Insert subscription plans
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert([
        {
          name: 'Basic',
          price: 99.00,
          max_locations: 3,
          max_attendants: 5,
          features: {
            dashboard: true,
            basic_analytics: true,
            email_support: true
          }
        },
        {
          name: 'Standard',
          price: 199.00,
          max_locations: 10,
          max_attendants: 20,
          features: {
            dashboard: true,
            advanced_analytics: true,
            email_support: true,
            phone_support: true,
            realtime_updates: true
          }
        },
        {
          name: 'Premium',
          price: 499.00,
          max_locations: 50,
          max_attendants: 100,
          features: {
            dashboard: true,
            advanced_analytics: true,
            email_support: true,
            phone_support: true,
            realtime_updates: true,
            custom_branding: true,
            api_access: true,
            priority_support: true
          }
        }
      ])
      .select();

    if (error) {
      console.error('❌ Error inserting subscription plans:', error);
    } else {
      console.log('✅ Successfully inserted subscription plans:');
      data.forEach(plan => {
        console.log(`   - ${plan.name}: $${plan.price} (${plan.max_locations} locations, ${plan.max_attendants} attendants)`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
insertSubscriptionPlans();
