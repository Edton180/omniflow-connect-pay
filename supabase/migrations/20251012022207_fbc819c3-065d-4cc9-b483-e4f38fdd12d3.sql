-- Update channels type check to include baileys
ALTER TABLE public.channels DROP CONSTRAINT IF EXISTS channels_type_check;

ALTER TABLE public.channels ADD CONSTRAINT channels_type_check 
CHECK (type = ANY (ARRAY['whatsapp'::text, 'whatsapp_baileys'::text, 'email'::text, 'telegram'::text, 'instagram'::text, 'facebook'::text, 'webchat'::text]));

-- Create table for user queue assignments
CREATE TABLE IF NOT EXISTS public.user_queues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, queue_id)
);

-- Enable RLS on user_queues
ALTER TABLE public.user_queues ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_queues
CREATE POLICY "Users can view queue assignments in their tenant"
ON public.user_queues
FOR SELECT
USING (
  queue_id IN (
    SELECT id FROM public.queues 
    WHERE has_tenant_access(auth.uid(), tenant_id)
  )
);

CREATE POLICY "Admins can manage queue assignments"
ON public.user_queues
FOR ALL
USING (
  queue_id IN (
    SELECT id FROM public.queues 
    WHERE has_role(auth.uid(), 'super_admin') 
    OR (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
  )
);

-- Add queue_id column to channels table
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS queue_id UUID REFERENCES public.queues(id) ON DELETE SET NULL;

-- Create landing_page_settings table for customizable landing page
CREATE TABLE IF NOT EXISTS public.landing_page_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_title TEXT NOT NULL DEFAULT 'OmniFlow - Plataforma de Atendimento Multicanal',
  hero_subtitle TEXT NOT NULL DEFAULT 'Gerencie todos os seus canais de atendimento em um só lugar',
  hero_cta_text TEXT NOT NULL DEFAULT 'Começar Agora',
  hero_image_url TEXT,
  feature_1_title TEXT NOT NULL DEFAULT 'Atendimento Multicanal',
  feature_1_description TEXT NOT NULL DEFAULT 'WhatsApp, Email, Telegram e mais',
  feature_1_icon TEXT NOT NULL DEFAULT 'MessageSquare',
  feature_2_title TEXT NOT NULL DEFAULT 'Gestão de Filas',
  feature_2_description TEXT NOT NULL DEFAULT 'Organize e distribua atendimentos',
  feature_2_icon TEXT NOT NULL DEFAULT 'Users',
  feature_3_title TEXT NOT NULL DEFAULT 'Relatórios Detalhados',
  feature_3_description TEXT NOT NULL DEFAULT 'Acompanhe métricas e performance',
  feature_3_icon TEXT NOT NULL DEFAULT 'BarChart',
  pricing_title TEXT NOT NULL DEFAULT 'Planos e Preços',
  pricing_subtitle TEXT NOT NULL DEFAULT 'Escolha o melhor plano para seu negócio',
  footer_text TEXT NOT NULL DEFAULT '© 2025 OmniFlow. Todos os direitos reservados.',
  primary_color TEXT NOT NULL DEFAULT '#8B5CF6',
  secondary_color TEXT NOT NULL DEFAULT '#3B82F6',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default landing page settings
INSERT INTO public.landing_page_settings (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Enable RLS on landing_page_settings
ALTER TABLE public.landing_page_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for landing_page_settings
CREATE POLICY "Everyone can view landing page settings"
ON public.landing_page_settings
FOR SELECT
USING (true);

CREATE POLICY "Only super admins can manage landing page settings"
ON public.landing_page_settings
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));