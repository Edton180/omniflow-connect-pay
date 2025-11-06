-- Fase 2: Corrigir constraint action_type_check da tabela menu_items
-- Passo 1: Atualizar tipos antigos para o padrão correto
UPDATE menu_items SET action_type = 'forward_to_queue' WHERE action_type = 'queue';

-- Passo 2: Dropar constraint antigo que está incompleto
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS action_type_check;

-- Passo 3: Criar novo constraint com TODOS os tipos de ação suportados
ALTER TABLE menu_items ADD CONSTRAINT action_type_check 
CHECK (action_type IN (
  'send_message',
  'send_file',
  'forward_to_agent',
  'forward_to_queue',
  'forward_to_bot',
  'send_evaluation',
  'assistant_gpt',
  'assistant_gemini',
  'assistant_grok',
  'submenu',
  'end_conversation'
));