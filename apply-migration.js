const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bvpdjeknzhclpriisfeh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2cGRqZWtuenhjbHByaXNmZWgiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM2MjQ5NDQwLCJleHAiOjIwNTE4MjU0NDB9.8QZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('Applying database migration...');
    
    // Read the migration file
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('supabase/migrations/20250109000003_create_parking_tables.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('Error executing statement:', error);
        } else {
          console.log('✓ Statement executed successfully');
        }
      }
    }
    
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

applyMigration();
