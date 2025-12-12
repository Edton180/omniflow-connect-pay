-- Adicionar campos para favicon, meta tags e Feature 4 na landing page
ALTER TABLE public.landing_page_settings 
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS og_image_url TEXT,
ADD COLUMN IF NOT EXISTS feature_4_title TEXT DEFAULT 'Automações Inteligentes',
ADD COLUMN IF NOT EXISTS feature_4_description TEXT DEFAULT 'Fluxos automatizados com IA para respostas rápidas e eficientes',
ADD COLUMN IF NOT EXISTS feature_4_icon TEXT DEFAULT 'Bot';

-- Atualizar registros existentes com valores padrão
UPDATE public.landing_page_settings 
SET 
  feature_4_title = COALESCE(feature_4_title, 'Automações Inteligentes'),
  feature_4_description = COALESCE(feature_4_description, 'Fluxos automatizados com IA para respostas rápidas e eficientes'),
  feature_4_icon = COALESCE(feature_4_icon, 'Bot')
WHERE feature_4_title IS NULL;