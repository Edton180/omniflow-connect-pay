-- Drop the existing check constraint
ALTER TABLE public.channels DROP CONSTRAINT IF EXISTS channels_type_check;

-- Recreate the constraint with all valid channel types including whatsapp_baileys
ALTER TABLE public.channels ADD CONSTRAINT channels_type_check 
CHECK (type IN ('whatsapp', 'whatsapp_baileys', 'email', 'telegram', 'instagram', 'facebook', 'webchat'));