-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  max_locations INTEGER NOT NULL,
  max_attendants INTEGER NOT NULL,
  features JSONB DEFAULT '{}',
  created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false
);

-- Create users table (profiles for auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  contractor_name VARCHAR(255),
  attendant_name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'contractor', 'attendant')),
  status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  is_first_login BOOLEAN DEFAULT true,
  device_fingerprint VARCHAR(255),
  subscription_plan_id UUID REFERENCES public.subscription_plans(id),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_by UUID REFERENCES auth.users(id),
  created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_on TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false
);

-- Create contractors table
CREATE TABLE public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name VARCHAR(100),
  contact_number VARCHAR(20),
  status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  allowed_locations INTEGER DEFAULT 5,
  allowed_attendants_per_location INTEGER DEFAULT 10,
  rates_2wheeler JSONB DEFAULT '{"upTo2Hours": 2, "upTo6Hours": 5, "upTo12Hours": 8, "upTo24Hours": 12}',
  rates_4wheeler JSONB DEFAULT '{"upTo2Hours": 5, "upTo6Hours": 10, "upTo12Hours": 18, "upTo24Hours": 30}',
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_by UUID REFERENCES auth.users(id),
  created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_on TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false
);

-- Create parking locations table
CREATE TABLE public.parking_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locations_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  contractor_id UUID NOT NULL REFERENCES public.contractors(id),
  total_slots INTEGER DEFAULT 0,
  occupied_slots INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_by UUID REFERENCES auth.users(id),
  created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_on TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false
);

-- Create attendants table
CREATE TABLE public.attendants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.parking_locations(id),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_by UUID REFERENCES auth.users(id),
  created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_on TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('2-wheeler', '4-wheeler')),
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_time TIMESTAMP WITH TIME ZONE,
  location_id UUID NOT NULL REFERENCES public.parking_locations(id),
  contractor_id UUID NOT NULL REFERENCES public.contractors(id),
  gate_in_id UUID REFERENCES auth.users(id),
  gate_out_id UUID REFERENCES auth.users(id),
  session_id UUID,
  payment_amount DECIMAL(10,2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  receipt_id VARCHAR(50) UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_by UUID REFERENCES auth.users(id),
  created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_on TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false
);

-- Create sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  location_id UUID NOT NULL REFERENCES public.parking_locations(id),
  gate_in_id UUID NOT NULL REFERENCES auth.users(id),
  gate_out_id UUID REFERENCES auth.users(id),
  time_in TIMESTAMP WITH TIME ZONE NOT NULL,
  time_out TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  payment_amount DECIMAL(10,2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_by UUID REFERENCES auth.users(id),
  created_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_on TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- RLS Policies for subscription_plans
CREATE POLICY "Super admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "All users can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Super admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for contractors
CREATE POLICY "Super admins can manage all contractors" ON public.contractors
  FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Contractors can view their own data" ON public.contractors
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Contractors can update their own data" ON public.contractors
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for parking_locations
CREATE POLICY "Super admins can manage all locations" ON public.parking_locations
  FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Contractors can manage their locations" ON public.parking_locations
  FOR ALL USING (
    contractor_id IN (
      SELECT id FROM public.contractors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Attendants can view their assigned location" ON public.parking_locations
  FOR SELECT USING (
    id IN (
      SELECT location_id FROM public.attendants WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for attendants
CREATE POLICY "Super admins can manage all attendants" ON public.attendants
  FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Contractors can manage attendants in their locations" ON public.attendants
  FOR ALL USING (
    location_id IN (
      SELECT id FROM public.parking_locations 
      WHERE contractor_id IN (
        SELECT id FROM public.contractors WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Attendants can view their own data" ON public.attendants
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for vehicles
CREATE POLICY "Super admins can view all vehicles" ON public.vehicles
  FOR SELECT USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Contractors can view vehicles in their locations" ON public.vehicles
  FOR SELECT USING (
    contractor_id IN (
      SELECT id FROM public.contractors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Attendants can manage vehicles in their location" ON public.vehicles
  FOR ALL USING (
    location_id IN (
      SELECT location_id FROM public.attendants WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for sessions
CREATE POLICY "Super admins can view all sessions" ON public.sessions
  FOR SELECT USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Contractors can view sessions in their locations" ON public.sessions
  FOR SELECT USING (
    location_id IN (
      SELECT id FROM public.parking_locations 
      WHERE contractor_id IN (
        SELECT id FROM public.contractors WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Attendants can manage sessions in their location" ON public.sessions
  FOR ALL USING (
    location_id IN (
      SELECT location_id FROM public.attendants WHERE user_id = auth.uid()
    )
  );

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'user_name', 'New User'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_on = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers to all tables
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contractors_updated_at BEFORE UPDATE ON public.contractors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parking_locations_updated_at BEFORE UPDATE ON public.parking_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendants_updated_at BEFORE UPDATE ON public.attendants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample subscription plans
INSERT INTO public.subscription_plans (name, price, max_locations, max_attendants, features) VALUES
('Basic', 99.00, 3, 5, '{"dashboard": true, "basic_analytics": true, "email_support": true}'),
('Standard', 199.00, 10, 20, '{"dashboard": true, "advanced_analytics": true, "email_support": true, "phone_support": true, "realtime_updates": true}'),
('Premium', 499.00, 50, 100, '{"dashboard": true, "advanced_analytics": true, "email_support": true, "phone_support": true, "realtime_updates": true, "custom_branding": true, "api_access": true, "priority_support": true}');

-- Enable realtime for all tables
ALTER TABLE public.subscription_plans REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.contractors REPLICA IDENTITY FULL;
ALTER TABLE public.parking_locations REPLICA IDENTITY FULL;
ALTER TABLE public.attendants REPLICA IDENTITY FULL;
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;
ALTER TABLE public.sessions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contractors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;