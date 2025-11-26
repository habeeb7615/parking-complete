-- Create super admin user
-- Note: This will create the user in auth.users and the profile in public.profiles

-- First, let's create a function to create admin user
CREATE OR REPLACE FUNCTION public.create_admin_user()
RETURNS void AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Insert into auth.users (this needs to be done through Supabase Dashboard or API)
  -- For now, we'll just create the profile structure
  
  -- Create a placeholder UUID for admin user
  -- You'll need to replace this with the actual user ID from auth.users
  admin_user_id := '00000000-0000-0000-0000-000000000000';
  
  -- Insert admin profile (this will be updated once the auth user is created)
  INSERT INTO public.profiles (
    id,
    user_name,
    email,
    role,
    status,
    is_first_login,
    created_on
  ) VALUES (
    admin_user_id,
    'Super Admin',
    'admin@parkflow.com',
    'super_admin',
    'active',
    false,
    NOW()
  ) ON CONFLICT (email) DO UPDATE SET
    role = 'super_admin',
    status = 'active',
    is_first_login = false;
    
  RAISE NOTICE 'Admin profile created. Please create the auth user manually and update the ID.';
END;
$$ LANGUAGE plpgsql;

-- Call the function
SELECT public.create_admin_user();

-- Clean up the function
DROP FUNCTION public.create_admin_user();
