-- Adicionar campo para mensagem customizável ao direcionar para fila
ALTER TABLE queues 
ADD COLUMN IF NOT EXISTS routing_message TEXT DEFAULT 'Você foi direcionado para: {queue_name}';

COMMENT ON COLUMN queues.routing_message IS 'Mensagem enviada ao cliente quando direcionado para esta fila. Use {queue_name} para incluir o nome da fila.';