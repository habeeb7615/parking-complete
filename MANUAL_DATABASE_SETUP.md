# Manual Database Setup

Since the Supabase CLI is not available, please run these SQL commands manually in your Supabase Dashboard:

## Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard/project/bvpdjeknzhclpriisfeh
2. Navigate to: SQL Editor

## Step 2: Run the following SQL commands

```sql
-- Create contractors table
CREATE TABLE IF NOT EXISTS public.contractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create parking_locations table
CREATE TABLE IF NOT EXISTS public.parking_locations (
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
);

-- Create attendants table
CREATE TABLE IF NOT EXISTS public.attendants (
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
);

-- Create attendant_locations junction table
CREATE TABLE IF NOT EXISTS public.attendant_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendant_id UUID REFERENCES public.attendants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.parking_locations(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    UNIQUE(attendant_id, location_id)
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
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
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
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
);
```

## Step 3: Enable Row Level Security

```sql
-- Enable RLS
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendant_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
```

## Step 4: Create RLS Policies

```sql
-- Basic RLS policies (allow all for now)
CREATE POLICY "Allow all for contractors" ON public.contractors FOR ALL USING (true);
CREATE POLICY "Allow all for parking_locations" ON public.parking_locations FOR ALL USING (true);
CREATE POLICY "Allow all for attendants" ON public.attendants FOR ALL USING (true);
CREATE POLICY "Allow all for attendant_locations" ON public.attendant_locations FOR ALL USING (true);
CREATE POLICY "Allow all for vehicles" ON public.vehicles FOR ALL USING (true);
CREATE POLICY "Allow all for payments" ON public.payments FOR ALL USING (true);
```

## Step 5: Create Indexes

```sql
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contractors_email ON public.contractors(email);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON public.contractors(status);
CREATE INDEX IF NOT EXISTS idx_parking_locations_contractor ON public.parking_locations(contractor_id);
CREATE INDEX IF NOT EXISTS idx_parking_locations_status ON public.parking_locations(status);
CREATE INDEX IF NOT EXISTS idx_attendants_contractor ON public.attendants(contractor_id);
CREATE INDEX IF NOT EXISTS idx_attendants_status ON public.attendants(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON public.vehicles(location_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON public.vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_payments_contractor ON public.payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_payments_location ON public.payments(location_id);
CREATE INDEX IF NOT EXISTS idx_payments_vehicle ON public.payments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);
```

## Step 6: Test the Setup

After running these commands, refresh your application and the errors should be resolved. The dashboard should now show proper data instead of all zeros.

## Troubleshooting

If you still see errors:
1. Check that all tables were created successfully
2. Verify that RLS policies are enabled
3. Make sure the table names match exactly (parking_locations, not locations)
4. Check the browser console for any remaining errors
