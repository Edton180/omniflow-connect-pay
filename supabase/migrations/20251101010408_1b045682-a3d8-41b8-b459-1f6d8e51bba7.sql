-- Adicionar coluna bot_state para gerenciar estado da conversa com o bot
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS bot_state JSONB DEFAULT '{"step": "initial"}'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN public.tickets.bot_state IS 'Estado atual da conversa com o bot (ex: inicial, aguardando menu, roteado)';
