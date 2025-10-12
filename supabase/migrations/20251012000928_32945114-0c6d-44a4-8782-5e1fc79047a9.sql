-- Create channels table for communication channels
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'email', 'telegram', 'instagram', 'facebook', 'webchat')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  config JSONB DEFAULT '{}'::jsonb,
  credentials_encrypted TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for channels
CREATE POLICY "Users can view channels in their tenant"
  ON public.channels
  FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Admins can manage channels in their tenant"
  ON public.channels
  FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
  );

-- Trigger for updated_at
CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();