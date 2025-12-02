-- Corrigir RLS da tabela global_themes para permitir visualização pública de temas ativos
DROP POLICY IF EXISTS "Anyone can view active themes" ON public.global_themes;

CREATE POLICY "Public can view active themes"
  ON public.global_themes
  FOR SELECT
  USING (is_active = true);

-- Corrigir RLS da tabela internal_messages para permitir INSERT e DELETE corretos
DROP POLICY IF EXISTS "Users can send messages in their tenant" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can view messages in their tenant" ON public.internal_messages;
DROP POLICY IF EXISTS "Recipients can mark as read" ON public.internal_messages;

CREATE POLICY "Users can send messages in their tenant"
  ON public.internal_messages
  FOR INSERT
  WITH CHECK (
    has_tenant_access(auth.uid(), tenant_id) 
    AND sender_id = auth.uid()
    AND (
      (recipient_id IS NOT NULL AND team_id IS NULL)
      OR (team_id IS NOT NULL AND team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can view messages in their tenant"
  ON public.internal_messages
  FOR SELECT
  USING (
    has_tenant_access(auth.uid(), tenant_id)
    AND (
      sender_id = auth.uid()
      OR recipient_id = auth.uid()
      OR (team_id IS NOT NULL AND team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Recipients can mark as read"
  ON public.internal_messages
  FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Users can delete own messages"
  ON public.internal_messages
  FOR DELETE
  USING (sender_id = auth.uid());