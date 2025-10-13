-- Criar tabela de equipes
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para equipes
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teams in their tenant"
  ON public.teams FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Admins can manage teams in their tenant"
  ON public.teams FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR 
    (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
  );

-- Criar tabela de membros de equipe
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para membros de equipe
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members in their tenant"
  ON public.team_members FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM public.teams WHERE has_tenant_access(auth.uid(), tenant_id)
    )
  );

CREATE POLICY "Admins can manage team members"
  ON public.team_members FOR ALL
  USING (
    team_id IN (
      SELECT id FROM public.teams 
      WHERE has_role(auth.uid(), 'super_admin') OR 
            (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
    )
  );

-- Adicionar campo team_id nas mensagens internas
ALTER TABLE public.internal_messages 
ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Criar tabela de relacionamento entre canais e filas
CREATE TABLE public.channel_queues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  queue_id UUID NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, queue_id)
);

-- RLS para channel_queues
ALTER TABLE public.channel_queues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view channel queues in their tenant"
  ON public.channel_queues FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM public.channels WHERE has_tenant_access(auth.uid(), tenant_id)
    )
  );

CREATE POLICY "Admins can manage channel queues"
  ON public.channel_queues FOR ALL
  USING (
    channel_id IN (
      SELECT id FROM public.channels 
      WHERE has_role(auth.uid(), 'super_admin') OR 
            (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id))
    )
  );

-- Função para criar lead automaticamente quando ticket é criado
CREATE OR REPLACE FUNCTION public.auto_create_crm_lead()
RETURNS TRIGGER AS $$
DECLARE
  first_column_id UUID;
BEGIN
  -- Buscar a primeira coluna do CRM do tenant
  SELECT id INTO first_column_id
  FROM public.crm_columns
  WHERE tenant_id = NEW.tenant_id
  ORDER BY position ASC
  LIMIT 1;

  -- Se existir uma coluna, criar o lead
  IF first_column_id IS NOT NULL THEN
    INSERT INTO public.crm_leads (
      tenant_id,
      column_id,
      ticket_id,
      contact_id,
      name,
      email,
      phone,
      position
    )
    SELECT 
      NEW.tenant_id,
      first_column_id,
      NEW.id,
      NEW.contact_id,
      c.name,
      c.email,
      c.phone,
      COALESCE((
        SELECT MAX(position) + 1 
        FROM public.crm_leads 
        WHERE column_id = first_column_id
      ), 0)
    FROM public.contacts c
    WHERE c.id = NEW.contact_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar lead automaticamente
CREATE TRIGGER trigger_auto_create_crm_lead
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_crm_lead();

-- Trigger para atualizar updated_at em teams
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para novas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_queues;