-- Create table to store Baileys sessions
CREATE TABLE IF NOT EXISTS public.baileys_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'qr')),
  qr_code TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(channel_id)
);

-- Enable RLS
ALTER TABLE public.baileys_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view sessions in their tenant"
ON public.baileys_sessions
FOR SELECT
USING (
  channel_id IN (
    SELECT id FROM public.channels WHERE has_tenant_access(auth.uid(), tenant_id)
  )
);

CREATE POLICY "Admins can manage sessions in their tenant"
ON public.baileys_sessions
FOR ALL
USING (
  channel_id IN (
    SELECT id FROM public.channels 
    WHERE has_tenant_access(auth.uid(), tenant_id)
    AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'tenant_admin'))
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_baileys_sessions_updated_at
BEFORE UPDATE ON public.baileys_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_baileys_sessions_channel_id ON public.baileys_sessions(channel_id);
CREATE INDEX idx_baileys_sessions_status ON public.baileys_sessions(status);