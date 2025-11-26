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
CREATE INDEX IF NOT EXISTS idx_payments_contractor ON public.payments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_payments_location ON public.payments(location_id);
CREATE INDEX IF NOT EXISTS idx_payments_vehicle ON public.payments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments
CREATE POLICY "Allow all for payments" ON public.payments FOR ALL USING (true);
