-- Corrigir constraint de action_type para incluir TODOS os tipos necessários
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_action_type_check;
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS action_type_check;

-- Adicionar constraint com TODOS os tipos de ação suportados
ALTER TABLE menu_items ADD CONSTRAINT menu_items_action_type_check 
CHECK (action_type IN (
  'send_message',
  'send_file',
  'forward_to_agent',
  'forward_to_queue',
  'forward_to_bot',
  'end_conversation',
  'submenu',
  'send_evaluation',
  'assistant_gpt',
  'assistant_gemini',
  'assistant_grok'
));