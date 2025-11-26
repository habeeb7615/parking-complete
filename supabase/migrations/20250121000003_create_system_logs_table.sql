-- Create system_logs table for tracking system events
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success')),
    message TEXT NOT NULL,
    details TEXT,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100),
    resource VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON public.system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_resource ON public.system_logs(resource);

-- Enable Row Level Security
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow anon to read system logs" ON public.system_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to read system logs" ON public.system_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow service role to manage system logs" ON public.system_logs
    FOR ALL USING (true);

CREATE POLICY "Allow super admin to manage system logs" ON public.system_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );
