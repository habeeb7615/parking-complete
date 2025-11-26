// Script to fix the infinite recursion issue in parking_locations policies
// Run this with: node fix-database-policies.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPolicies() {
  try {
    console.log('Starting to fix database policies...');

    // Read the migration file
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./supabase/migrations/20250109000005_fix_parking_locations_policies_final.sql', 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      }
    }

    console.log('Policy fix completed!');
    
    // Test the fix by trying to query parking_locations
    console.log('Testing the fix...');
    const { data, error } = await supabase
      .from('parking_locations')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Test query failed:', error);
    } else {
      console.log('Test query successful! Dashboard should now work.');
    }

  } catch (error) {
    console.error('Error fixing policies:', error);
  }
}

// Alternative approach using direct SQL execution
async function fixPoliciesDirect() {
  try {
    console.log('Fixing policies using direct SQL execution...');

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
      console.error('Error dropping policies:', dropError);
      return;
    }

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
      console.error('Error creating policies:', createError);
      return;
    }

    console.log('Policies fixed successfully!');

  } catch (error) {
    console.error('Error in direct fix:', error);
  }
}

// Run the fix
if (require.main === module) {
  console.log('Choose fix method:');
  console.log('1. Full migration (recommended)');
  console.log('2. Direct SQL fix');
  
  const method = process.argv[2] || '2';
  
  if (method === '1') {
    fixPolicies();
  } else {
    fixPoliciesDirect();
  }
}

module.exports = { fixPolicies, fixPoliciesDirect };
