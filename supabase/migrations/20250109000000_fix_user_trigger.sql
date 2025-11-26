-- Fix the handle_new_user function to include required role field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'user_name', 'New User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'attendant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
