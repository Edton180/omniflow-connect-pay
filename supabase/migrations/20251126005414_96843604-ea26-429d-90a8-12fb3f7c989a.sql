-- Adicionar o status 'pending_verification' ao check constraint da tabela invoices
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'pending_verification'));