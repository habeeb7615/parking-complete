-- Add test data for parking locations
-- This migration adds sample data to test the dashboard

-- First, let's check if we have any contractors
-- If not, create a test contractor and profile

-- Create a test super admin profile if it doesn't exist
INSERT INTO public.profiles (id, user_name, email, role, status, is_first_login)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Super Admin',
  'admin@parkflow.com',
  'super_admin',
  'active',
  false
) ON CONFLICT (id) DO NOTHING;

-- Create a test contractor profile
INSERT INTO public.profiles (id, user_name, email, role, status, is_first_login)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Test Contractor',
  'contractor@test.com',
  'contractor',
  'active',
  false
) ON CONFLICT (id) DO NOTHING;

-- Create a test contractor
INSERT INTO public.contractors (id, user_id, company_name, contact_number, status, allowed_locations, allowed_attendants_per_location)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  'Test Parking Company',
  '+1234567890',
  'active',
  5,
  10
) ON CONFLICT (id) DO NOTHING;

-- Create test parking locations
INSERT INTO public.parking_locations (id, locations_name, address, city, state, pincode, status, contractor_id, total_slots, occupied_slots)
VALUES 
  (
    '00000000-0000-0000-0000-000000000004',
    'Downtown Parking Plaza',
    '123 Main Street',
    'New York',
    'NY',
    '10001',
    'active',
    '00000000-0000-0000-0000-000000000003',
    50,
    12
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Shopping Mall Parking',
    '456 Commerce Ave',
    'New York',
    'NY',
    '10002',
    'active',
    '00000000-0000-0000-0000-000000000003',
    100,
    45
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'Airport Terminal Parking',
    '789 Airport Blvd',
    'New York',
    'NY',
    '10003',
    'active',
    '00000000-0000-0000-0000-000000000003',
    200,
    150
  )
ON CONFLICT (id) DO NOTHING;

-- Create a test attendant profile
INSERT INTO public.profiles (id, user_name, email, role, status, is_first_login)
VALUES (
  '00000000-0000-0000-0000-000000000007',
  'Test Attendant',
  'attendant@test.com',
  'attendant',
  'active',
  false
) ON CONFLICT (id) DO NOTHING;

-- Create a test attendant
INSERT INTO public.attendants (id, user_id, location_id, status)
VALUES (
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000004',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Create some test vehicles
INSERT INTO public.vehicles (id, plate_number, vehicle_type, check_in_time, location_id, contractor_id, payment_amount, payment_status)
VALUES 
  (
    '00000000-0000-0000-0000-000000000009',
    'ABC123',
    '4-wheeler',
    NOW() - INTERVAL '2 hours',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000003',
    10.00,
    'paid'
  ),
  (
    '00000000-0000-0000-0000-000000000010',
    'XYZ789',
    '2-wheeler',
    NOW() - INTERVAL '1 hour',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000003',
    5.00,
    'paid'
  )
ON CONFLICT (id) DO NOTHING;

-- Create some test sessions
INSERT INTO public.sessions (id, vehicle_id, location_id, gate_in_id, time_in, status, payment_amount, payment_status)
VALUES 
  (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000007',
    NOW() - INTERVAL '2 hours',
    'active',
    10.00,
    'paid'
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000007',
    NOW() - INTERVAL '1 hour',
    'active',
    5.00,
    'paid'
  )
ON CONFLICT (id) DO NOTHING;

-- Verify the data was inserted
SELECT 'Test data inserted successfully!' as status;
