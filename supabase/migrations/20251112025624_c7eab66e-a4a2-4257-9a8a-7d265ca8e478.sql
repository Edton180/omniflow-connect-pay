-- Criar função para auto-atribuir agente ao responder ticket
CREATE OR REPLACE FUNCTION public.auto_assign_agent_on_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se a mensagem é de um agente (não do contato) e tem sender_id
  IF NEW.is_from_contact = false AND NEW.sender_id IS NOT NULL THEN
    -- Atualizar o ticket para atribuir o agente, apenas se ainda não estiver atribuído
    UPDATE tickets
    SET 
      assigned_to = NEW.sender_id,
      updated_at = NOW()
    WHERE 
      id = NEW.ticket_id 
      AND assigned_to IS NULL;
      
    -- Log da atribuição
    IF FOUND THEN
      RAISE NOTICE 'Ticket % automaticamente atribuído ao agente %', NEW.ticket_id, NEW.sender_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para executar após inserção de mensagem
DROP TRIGGER IF EXISTS trigger_auto_assign_agent ON messages;
CREATE TRIGGER trigger_auto_assign_agent
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_agent_on_reply();