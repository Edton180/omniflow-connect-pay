-- Adicionar evolution-api como tipo válido de canal
ALTER TABLE public.channels DROP CONSTRAINT IF EXISTS channels_type_check;

ALTER TABLE public.channels ADD CONSTRAINT channels_type_check 
CHECK (type IN ('whatsapp', 'whatsapp_baileys', 'evolution-api', 'email', 'telegram', 'instagram', 'facebook', 'webchat'));