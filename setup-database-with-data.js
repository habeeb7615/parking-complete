import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bvpdjeknzhclpriisfeh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2cGRqZWtuemhjbHByaWlzZmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjUwNzYsImV4cCI6MjA3Mjc0MTA3Nn0.Bv7ye97wldyhhxvjCC8VidkdrIZFi0Xsu8Fq42fSka8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up ParkFlow database with sample data...\n');

  try {
    // Step 1: Drop existing tables (in correct order due to foreign keys)
    console.log('1. Cleaning up existing tables...');
    await supabase.rpc('exec_sql', { 
      sql: 'DROP TABLE IF EXISTS public.payments CASCADE;' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'DROP TABLE IF EXISTS public.vehicles CASCADE;' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'DROP TABLE IF EXISTS public.attendant_locations CASCADE;' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'DROP TABLE IF EXISTS public.attendants CASCADE;' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'DROP TABLE IF EXISTS public.parking_locations CASCADE;' 
    });
    console.log('✅ Tables dropped successfully\n');

    // Step 2: Create tables
    console.log('2. Creating tables...');
    
    // Create parking_locations table
    await supabase.rpc('exec_sql', { 
      sql: `CREATE TABLE public.parking_locations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        total_slots INTEGER NOT NULL DEFAULT 0,
        hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES auth.users(id)
      );`
    });

    // Create attendants table
    await supabase.rpc('exec_sql', { 
      sql: `CREATE TABLE public.attendants (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(20),
        contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'off_duty')),
        shift_start TIME,
        shift_end TIME,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES auth.users(id)
      );`
    });

    // Create attendant_locations junction table
    await supabase.rpc('exec_sql', { 
      sql: `CREATE TABLE public.attendant_locations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        attendant_id UUID REFERENCES public.attendants(id) ON DELETE CASCADE,
        location_id UUID REFERENCES public.parking_locations(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        assigned_by UUID REFERENCES auth.users(id),
        UNIQUE(attendant_id, location_id)
      );`
    });

    // Create vehicles table
    await supabase.rpc('exec_sql', { 
      sql: `CREATE TABLE public.vehicles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        license_plate VARCHAR(20) NOT NULL,
        vehicle_type VARCHAR(50) DEFAULT 'car' CHECK (vehicle_type IN ('car', 'motorcycle', 'truck', 'bus')),
        color VARCHAR(50),
        make VARCHAR(100),
        model VARCHAR(100),
        location_id UUID REFERENCES public.parking_locations(id) ON DELETE CASCADE,
        attendant_id UUID REFERENCES public.attendants(id),
        check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        check_out_time TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'parked' CHECK (status IN ('parked', 'checked_out', 'overdue')),
        slot_number VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    });

    // Create payments table
    await supabase.rpc('exec_sql', { 
      sql: `CREATE TABLE public.payments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
        location_id UUID REFERENCES public.parking_locations(id) ON DELETE CASCADE,
        contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE,
        attendant_id UUID REFERENCES public.attendants(id),
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'digital', 'free')),
        payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
        duration_hours DECIMAL(5,2),
        hourly_rate DECIMAL(10,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    });

    console.log('✅ Tables created successfully\n');

    // Step 3: Enable RLS
    console.log('3. Enabling Row Level Security...');
    await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.parking_locations ENABLE ROW LEVEL SECURITY;' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.attendant_locations ENABLE ROW LEVEL SECURITY;' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;' 
    });
    console.log('✅ RLS enabled successfully\n');

    // Step 4: Create simple RLS policies
    console.log('4. Creating RLS policies...');
    await supabase.rpc('exec_sql', { 
      sql: 'CREATE POLICY "Allow all for parking_locations" ON public.parking_locations FOR ALL USING (true);' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'CREATE POLICY "Allow all for attendants" ON public.attendants FOR ALL USING (true);' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'CREATE POLICY "Allow all for attendant_locations" ON public.attendant_locations FOR ALL USING (true);' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'CREATE POLICY "Allow all for vehicles" ON public.vehicles FOR ALL USING (true);' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'CREATE POLICY "Allow all for payments" ON public.payments FOR ALL USING (true);' 
    });
    console.log('✅ RLS policies created successfully\n');

    // Step 5: Add sample data
    console.log('5. Adding sample data...');

    // First, get or create contractors
    let contractors = [];
    const { data: existingContractors } = await supabase.from('contractors').select('*');
    
    if (!existingContractors || existingContractors.length === 0) {
      console.log('   Creating sample contractors...');
      const { data: newContractors, error: contractorError } = await supabase
        .from('contractors')
        .insert([
          {
            name: 'Downtown Parking Solutions',
            email: 'contact@downtownparking.com',
            phone_number: '+1-555-0101',
            address: '123 Main Street, Downtown',
            status: 'active'
          },
          {
            name: 'Mall Parking Management',
            email: 'info@mallparking.com',
            phone_number: '+1-555-0102',
            address: '456 Mall Avenue, Shopping District',
            status: 'active'
          },
          {
            name: 'Airport Parking Services',
            email: 'support@airportparking.com',
            phone_number: '+1-555-0103',
            address: '789 Airport Road, Terminal Area',
            status: 'active'
          }
        ])
        .select();
      
      if (contractorError) {
        console.error('Error creating contractors:', contractorError);
      } else {
        contractors = newContractors;
        console.log(`   ✅ Created ${contractors.length} contractors`);
      }
    } else {
      contractors = existingContractors;
      console.log(`   ✅ Found ${contractors.length} existing contractors`);
    }

    // Create parking locations
    console.log('   Creating sample parking locations...');
    const { data: locations, error: locationError } = await supabase
      .from('parking_locations')
      .insert([
        {
          name: 'Downtown Plaza Parking',
          address: '123 Main Street, Downtown',
          total_slots: 50,
          hourly_rate: 2.50,
          contractor_id: contractors[0].id,
          status: 'active'
        },
        {
          name: 'City Mall Parking',
          address: '456 Mall Avenue, Shopping District',
          total_slots: 100,
          hourly_rate: 3.00,
          contractor_id: contractors[1].id,
          status: 'active'
        },
        {
          name: 'Airport Terminal A',
          address: '789 Airport Road, Terminal A',
          total_slots: 200,
          hourly_rate: 4.00,
          contractor_id: contractors[2].id,
          status: 'active'
        },
        {
          name: 'Business District Parking',
          address: '321 Corporate Blvd, Business District',
          total_slots: 75,
          hourly_rate: 3.50,
          contractor_id: contractors[0].id,
          status: 'active'
        },
        {
          name: 'Shopping Center Parking',
          address: '654 Retail Street, Shopping Center',
          total_slots: 120,
          hourly_rate: 2.75,
          contractor_id: contractors[1].id,
          status: 'active'
        }
      ])
      .select();

    if (locationError) {
      console.error('Error creating locations:', locationError);
    } else {
      console.log(`   ✅ Created ${locations.length} parking locations`);
    }

    // Create attendants
    console.log('   Creating sample attendants...');
    const { data: attendants, error: attendantError } = await supabase
      .from('attendants')
      .insert([
        {
          name: 'John Smith',
          email: 'john.smith@downtownparking.com',
          phone_number: '+1-555-1001',
          contractor_id: contractors[0].id,
          status: 'active',
          shift_start: '08:00',
          shift_end: '16:00'
        },
        {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@downtownparking.com',
          phone_number: '+1-555-1002',
          contractor_id: contractors[0].id,
          status: 'active',
          shift_start: '16:00',
          shift_end: '00:00'
        },
        {
          name: 'Mike Davis',
          email: 'mike.davis@mallparking.com',
          phone_number: '+1-555-1003',
          contractor_id: contractors[1].id,
          status: 'active',
          shift_start: '09:00',
          shift_end: '17:00'
        },
        {
          name: 'Lisa Wilson',
          email: 'lisa.wilson@mallparking.com',
          phone_number: '+1-555-1004',
          contractor_id: contractors[1].id,
          status: 'active',
          shift_start: '17:00',
          shift_end: '01:00'
        },
        {
          name: 'David Brown',
          email: 'david.brown@airportparking.com',
          phone_number: '+1-555-1005',
          contractor_id: contractors[2].id,
          status: 'active',
          shift_start: '06:00',
          shift_end: '14:00'
        },
        {
          name: 'Emma Taylor',
          email: 'emma.taylor@airportparking.com',
          phone_number: '+1-555-1006',
          contractor_id: contractors[2].id,
          status: 'active',
          shift_start: '14:00',
          shift_end: '22:00'
        }
      ])
      .select();

    if (attendantError) {
      console.error('Error creating attendants:', attendantError);
    } else {
      console.log(`   ✅ Created ${attendants.length} attendants`);
    }

    // Assign locations to attendants
    console.log('   Assigning locations to attendants...');
    const assignments = [
      { attendant_id: attendants[0].id, location_id: locations[0].id },
      { attendant_id: attendants[1].id, location_id: locations[0].id },
      { attendant_id: attendants[2].id, location_id: locations[1].id },
      { attendant_id: attendants[3].id, location_id: locations[1].id },
      { attendant_id: attendants[4].id, location_id: locations[2].id },
      { attendant_id: attendants[5].id, location_id: locations[2].id },
      { attendant_id: attendants[0].id, location_id: locations[3].id },
      { attendant_id: attendants[2].id, location_id: locations[4].id }
    ];

    const { error: assignmentError } = await supabase
      .from('attendant_locations')
      .insert(assignments);

    if (assignmentError) {
      console.error('Error assigning locations:', assignmentError);
    } else {
      console.log(`   ✅ Created ${assignments.length} location assignments`);
    }

    // Create vehicles
    console.log('   Creating sample vehicles...');
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .insert([
        {
          license_plate: 'ABC-123',
          vehicle_type: 'car',
          color: 'Blue',
          make: 'Toyota',
          model: 'Camry',
          location_id: locations[0].id,
          attendant_id: attendants[0].id,
          status: 'parked',
          slot_number: 'A-01',
          check_in_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        {
          license_plate: 'XYZ-789',
          vehicle_type: 'car',
          color: 'Red',
          make: 'Honda',
          model: 'Civic',
          location_id: locations[0].id,
          attendant_id: attendants[0].id,
          status: 'parked',
          slot_number: 'A-02',
          check_in_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
        },
        {
          license_plate: 'DEF-456',
          vehicle_type: 'car',
          color: 'White',
          make: 'Ford',
          model: 'Focus',
          location_id: locations[1].id,
          attendant_id: attendants[2].id,
          status: 'parked',
          slot_number: 'B-01',
          check_in_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
        },
        {
          license_plate: 'GHI-012',
          vehicle_type: 'truck',
          color: 'Black',
          make: 'Chevrolet',
          model: 'Silverado',
          location_id: locations[2].id,
          attendant_id: attendants[4].id,
          status: 'parked',
          slot_number: 'C-01',
          check_in_time: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
        },
        {
          license_plate: 'JKL-345',
          vehicle_type: 'car',
          color: 'Silver',
          make: 'BMW',
          model: 'X5',
          location_id: locations[2].id,
          attendant_id: attendants[4].id,
          status: 'checked_out',
          slot_number: 'C-02',
          check_in_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          check_out_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
        },
        {
          license_plate: 'MNO-678',
          vehicle_type: 'motorcycle',
          color: 'Yellow',
          make: 'Yamaha',
          model: 'R1',
          location_id: locations[3].id,
          attendant_id: attendants[0].id,
          status: 'parked',
          slot_number: 'D-01',
          check_in_time: new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 minutes ago
        }
      ])
      .select();

    if (vehicleError) {
      console.error('Error creating vehicles:', vehicleError);
    } else {
      console.log(`   ✅ Created ${vehicles.length} vehicles`);
    }

    // Create payments
    console.log('   Creating sample payments...');
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          vehicle_id: vehicles[0].id,
          location_id: locations[0].id,
          contractor_id: contractors[0].id,
          attendant_id: attendants[0].id,
          amount: 5.00,
          payment_method: 'cash',
          payment_status: 'completed',
          duration_hours: 2.0,
          hourly_rate: 2.50,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          vehicle_id: vehicles[1].id,
          location_id: locations[0].id,
          contractor_id: contractors[0].id,
          attendant_id: attendants[0].id,
          amount: 2.50,
          payment_method: 'card',
          payment_status: 'completed',
          duration_hours: 1.0,
          hourly_rate: 2.50,
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          vehicle_id: vehicles[2].id,
          location_id: locations[1].id,
          contractor_id: contractors[1].id,
          attendant_id: attendants[2].id,
          amount: 9.00,
          payment_method: 'digital',
          payment_status: 'completed',
          duration_hours: 3.0,
          hourly_rate: 3.00,
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          vehicle_id: vehicles[3].id,
          location_id: locations[2].id,
          contractor_id: contractors[2].id,
          attendant_id: attendants[4].id,
          amount: 2.00,
          payment_method: 'cash',
          payment_status: 'completed',
          duration_hours: 0.5,
          hourly_rate: 4.00,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          vehicle_id: vehicles[4].id,
          location_id: locations[2].id,
          contractor_id: contractors[2].id,
          attendant_id: attendants[4].id,
          amount: 12.00,
          payment_method: 'card',
          payment_status: 'completed',
          duration_hours: 3.0,
          hourly_rate: 4.00,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          vehicle_id: vehicles[5].id,
          location_id: locations[3].id,
          contractor_id: contractors[0].id,
          attendant_id: attendants[0].id,
          amount: 1.38,
          payment_method: 'digital',
          payment_status: 'completed',
          duration_hours: 0.75,
          hourly_rate: 3.50,
          created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        }
      ])
      .select();

    if (paymentError) {
      console.error('Error creating payments:', paymentError);
    } else {
      console.log(`   ✅ Created ${payments.length} payments`);
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${contractors.length} Contractors`);
    console.log(`   • ${locations.length} Parking Locations`);
    console.log(`   • ${attendants.length} Attendants`);
    console.log(`   • ${vehicles.length} Vehicles`);
    console.log(`   • ${payments.length} Payments`);
    console.log(`   • ${assignments.length} Location Assignments`);
    
    console.log('\n✅ Your ParkFlow dashboard should now show real data!');
    console.log('   Refresh your browser to see the changes.');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
}

setupDatabase();
