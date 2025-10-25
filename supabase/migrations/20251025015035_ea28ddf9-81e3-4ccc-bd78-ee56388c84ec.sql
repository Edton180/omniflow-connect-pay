-- Adicionar campos de status às mensagens
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed'));
ALTER TABLE messages ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Criar tabela para sessões de login via QR code do Telegram
CREATE TABLE IF NOT EXISTS telegram_qr_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  login_token TEXT NOT NULL,
  qr_code_url TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  bot_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para telegram_qr_sessions
ALTER TABLE telegram_qr_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view QR sessions in their tenant"
  ON telegram_qr_sessions FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Admins can manage QR sessions in their tenant"
  ON telegram_qr_sessions FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
  );

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_messages_telegram_id ON messages(telegram_message_id) WHERE telegram_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_telegram_qr_sessions_channel ON telegram_qr_sessions(channel_id);
CREATE INDEX IF NOT EXISTS idx_telegram_qr_sessions_status ON telegram_qr_sessions(status);