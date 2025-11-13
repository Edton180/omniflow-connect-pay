-- Adicionar foreign key entre invoices e tenants
ALTER TABLE public.invoices
ADD CONSTRAINT fk_invoices_tenant
FOREIGN KEY (tenant_id) 
REFERENCES public.tenants(id) 
ON DELETE CASCADE;