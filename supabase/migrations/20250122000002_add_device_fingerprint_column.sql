-- Add device_fingerprint column to profiles table for device restriction
ALTER TABLE profiles 
ADD COLUMN device_fingerprint TEXT DEFAULT NULL;

-- Add index for better performance
CREATE INDEX idx_profiles_device_fingerprint ON profiles(device_fingerprint) WHERE device_fingerprint IS NOT NULL;
