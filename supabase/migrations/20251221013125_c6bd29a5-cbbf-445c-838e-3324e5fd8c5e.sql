-- Adicionar colunas para configuração avançada de IA no chatbot_settings
ALTER TABLE public.chatbot_settings 
ADD COLUMN IF NOT EXISTS default_model text DEFAULT 'google/gemini-2.5-flash',
ADD COLUMN IF NOT EXISTS personality_prompt text,
ADD COLUMN IF NOT EXISTS tone text DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS max_tokens integer DEFAULT 1000,
ADD COLUMN IF NOT EXISTS temperature numeric DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS rate_limit integer DEFAULT 100;

-- Comentários
COMMENT ON COLUMN public.chatbot_settings.default_model IS 'Modelo de IA padrão para o tenant';
COMMENT ON COLUMN public.chatbot_settings.personality_prompt IS 'Prompt de personalidade da IA';
COMMENT ON COLUMN public.chatbot_settings.tone IS 'Tom de voz: professional, friendly, technical, empathetic';
COMMENT ON COLUMN public.chatbot_settings.max_tokens IS 'Máximo de tokens por resposta';
COMMENT ON COLUMN public.chatbot_settings.temperature IS 'Temperatura (0-1) para criatividade';
COMMENT ON COLUMN public.chatbot_settings.rate_limit IS 'Limite de requisições por minuto';