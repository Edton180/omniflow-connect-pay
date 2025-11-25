-- Adicionar campos para comprovantes de pagamento manual na tabela invoices
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS proof_file_url TEXT,
ADD COLUMN IF NOT EXISTS proof_submitted_at TIMESTAMPTZ;