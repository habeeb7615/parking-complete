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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contractors_email ON public.contractors(email);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON public.contractors(status);
CREATE INDEX IF NOT EXISTS idx_locations_contractor ON public.parking_locations(contractor_id);
CREATE INDEX IF NOT EXISTS idx_locations_status ON public.parking_locations(status);
CREATE INDEX IF NOT EXISTS idx_attendants_contractor ON public.attendants(contractor_id);
CREATE INDEX IF NOT EXISTS idx_attendants_status ON public.attendants(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON public.vehicles(location_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON public.vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_payments_contractor ON public.payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_payments_location ON public.payments(location_id);
CREATE INDEX IF NOT EXISTS idx_payments_vehicle ON public.payments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- Enable Row Level Security
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendant_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractors
CREATE POLICY "Super admins can view all contractors" ON public.contractors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Contractors can view their own data" ON public.contractors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'contractor' AND contractor_name = name
        )
    );

CREATE POLICY "Super admins can insert contractors" ON public.contractors
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update contractors" ON public.contractors
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- RLS Policies for parking_locations
CREATE POLICY "Super admins can view all locations" ON public.parking_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Contractors can view their locations" ON public.parking_locations
    FOR SELECT USING (
        contractor_id IN (
            SELECT id FROM public.contractors 
            WHERE contractor_name = (
                SELECT contractor_name FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Attendants can view assigned locations" ON public.parking_locations
    FOR SELECT USING (
        id IN (
            SELECT location_id FROM public.attendant_locations al
            JOIN public.attendants a ON al.attendant_id = a.id
            WHERE a.email = (
                SELECT email FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Super admins can insert locations" ON public.parking_locations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update locations" ON public.parking_locations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- RLS Policies for attendants
CREATE POLICY "Super admins can view all attendants" ON public.attendants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Contractors can view their attendants" ON public.attendants
    FOR SELECT USING (
        contractor_id IN (
            SELECT id FROM public.contractors 
            WHERE contractor_name = (
                SELECT contractor_name FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Contractors can insert attendants" ON public.attendants
    FOR INSERT WITH CHECK (
        contractor_id IN (
            SELECT id FROM public.contractors 
            WHERE contractor_name = (
                SELECT contractor_name FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Contractors can update their attendants" ON public.attendants
    FOR UPDATE USING (
        contractor_id IN (
            SELECT id FROM public.contractors 
            WHERE contractor_name = (
                SELECT contractor_name FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- RLS Policies for vehicles
CREATE POLICY "Super admins can view all vehicles" ON public.vehicles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Contractors can view vehicles in their locations" ON public.vehicles
    FOR SELECT USING (
        location_id IN (
            SELECT id FROM public.parking_locations 
            WHERE contractor_id IN (
                SELECT id FROM public.contractors 
                WHERE contractor_name = (
                    SELECT contractor_name FROM public.profiles 
                    WHERE id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Attendants can view vehicles in assigned locations" ON public.vehicles
    FOR SELECT USING (
        location_id IN (
            SELECT location_id FROM public.attendant_locations al
            JOIN public.attendants a ON al.attendant_id = a.id
            WHERE a.email = (
                SELECT email FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Attendants can insert vehicles" ON public.vehicles
    FOR INSERT WITH CHECK (
        location_id IN (
            SELECT location_id FROM public.attendant_locations al
            JOIN public.attendants a ON al.attendant_id = a.id
            WHERE a.email = (
                SELECT email FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Attendants can update vehicles in assigned locations" ON public.vehicles
    FOR UPDATE USING (
        location_id IN (
            SELECT location_id FROM public.attendant_locations al
            JOIN public.attendants a ON al.attendant_id = a.id
            WHERE a.email = (
                SELECT email FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- RLS Policies for payments
CREATE POLICY "Super admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Contractors can view their payments" ON public.payments
    FOR SELECT USING (
        contractor_id IN (
            SELECT id FROM public.contractors 
            WHERE contractor_name = (
                SELECT contractor_name FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Attendants can view payments for their locations" ON public.payments
    FOR SELECT USING (
        location_id IN (
            SELECT location_id FROM public.attendant_locations al
            JOIN public.attendants a ON al.attendant_id = a.id
            WHERE a.email = (
                SELECT email FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Attendants can insert payments" ON public.payments
    FOR INSERT WITH CHECK (
        location_id IN (
            SELECT location_id FROM public.attendant_locations al
            JOIN public.attendants a ON al.attendant_id = a.id
            WHERE a.email = (
                SELECT email FROM public.profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- RLS Policies for attendant_locations
CREATE POLICY "Super admins can view all attendant locations" ON public.attendant_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "Contractors can view their attendant locations" ON public.attendant_locations
    FOR SELECT USING (
        attendant_id IN (
            SELECT id FROM public.attendants 
            WHERE contractor_id IN (
                SELECT id FROM public.contractors 
                WHERE contractor_name = (
                    SELECT contractor_name FROM public.profiles 
                    WHERE id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Contractors can insert attendant locations" ON public.attendant_locations
    FOR INSERT WITH CHECK (
        attendant_id IN (
            SELECT id FROM public.attendants 
            WHERE contractor_id IN (
                SELECT id FROM public.contractors 
                WHERE contractor_name = (
                    SELECT contractor_name FROM public.profiles 
                    WHERE id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Contractors can update attendant locations" ON public.attendant_locations
    FOR UPDATE USING (
        attendant_id IN (
            SELECT id FROM public.attendants 
            WHERE contractor_id IN (
                SELECT id FROM public.contractors 
                WHERE contractor_name = (
                    SELECT contractor_name FROM public.profiles 
                    WHERE id = auth.uid()
                )
            )
        )
    );

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_contractors_updated_at BEFORE UPDATE ON public.contractors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.parking_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendants_updated_at BEFORE UPDATE ON public.attendants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
