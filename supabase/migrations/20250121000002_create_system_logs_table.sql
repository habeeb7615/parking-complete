-- Create system_logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success')),
    message TEXT NOT NULL,
    details TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON public.system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_resource ON public.system_logs(resource);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all for system_logs" ON public.system_logs FOR ALL USING (true);

-- Insert some sample logs
INSERT INTO public.system_logs (level, message, details, action, resource) VALUES
('info', 'System started successfully', 'ParkFlow system initialized', 'system_start', 'system'),
('success', 'Database connection established', 'Connected to Supabase database', 'database_connect', 'database'),
('info', 'System logs table created', 'System logging functionality enabled', 'table_create', 'database');
