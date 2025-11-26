-- Add INSERT policy for profiles table to allow new user registration
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow system to insert profiles during registration (for triggers and app code)
CREATE POLICY "Allow profile creation during registration" ON public.profiles
  FOR INSERT WITH CHECK (true);
