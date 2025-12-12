-- Add new configuration fields to chatbot_settings table
ALTER TABLE public.chatbot_settings 
ADD COLUMN IF NOT EXISTS suggestions_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS suggestions_tone TEXT DEFAULT 'professional' CHECK (suggestions_tone IN ('formal', 'professional', 'casual', 'technical')),
ADD COLUMN IF NOT EXISTS suggestions_count INTEGER DEFAULT 3 CHECK (suggestions_count >= 1 AND suggestions_count <= 5),
ADD COLUMN IF NOT EXISTS auto_improve_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_summary_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_translate_enabled BOOLEAN DEFAULT false;