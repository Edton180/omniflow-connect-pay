-- Add Foreign Keys to internal_messages
ALTER TABLE public.internal_messages 
  DROP CONSTRAINT IF EXISTS internal_messages_sender_id_fkey,
  DROP CONSTRAINT IF EXISTS internal_messages_recipient_id_fkey,
  DROP CONSTRAINT IF EXISTS internal_messages_team_id_fkey,
  DROP CONSTRAINT IF EXISTS internal_messages_tenant_id_fkey;

ALTER TABLE public.internal_messages 
  ADD CONSTRAINT internal_messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.internal_messages 
  ADD CONSTRAINT internal_messages_recipient_id_fkey 
  FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.internal_messages 
  ADD CONSTRAINT internal_messages_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.internal_messages 
  ADD CONSTRAINT internal_messages_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create user_presence table for online status tracking
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  last_seen timestamptz DEFAULT now(),
  is_online boolean DEFAULT false,
  status text DEFAULT 'available' CHECK (status IN ('available', 'busy', 'away'))
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view presence in their tenant"
  ON public.user_presence FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can update own presence"
  ON public.user_presence FOR ALL
  USING (user_id = auth.uid());

-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view typing in their tenant"
  ON public.typing_indicators FOR SELECT
  USING (has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can manage own typing indicator"
  ON public.typing_indicators FOR ALL
  USING (user_id = auth.uid());

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;