-- Criar tabela system_settings para configurações globais
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Super admins podem gerenciar, todos autenticados podem ler
CREATE POLICY "Super admins can manage system settings"
  ON public.system_settings
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  ));

CREATE POLICY "Authenticated users can read system settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Inserir configurações padrão de idioma
INSERT INTO public.system_settings (key, value, description) VALUES 
  ('default_language', '"pt-BR"', 'Idioma padrão do sistema'),
  ('auto_detect_language', 'true', 'Detectar idioma automaticamente do navegador'),
  ('available_languages', '["pt-BR", "en", "es", "zh-CN", "hi", "ja", "fr", "de", "it", "pt-PT", "ru", "ko", "ar", "tr", "nl", "pl", "sv", "no", "da", "fi", "cs", "el", "he", "th", "vi", "id"]', 'Lista de idiomas disponíveis')
ON CONFLICT (key) DO NOTHING;

-- Trigger para updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();