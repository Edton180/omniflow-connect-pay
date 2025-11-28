-- Revogar acesso direto à materialized view da API
REVOKE ALL ON agent_performance FROM anon, authenticated;

-- Criar função segura para acessar agent performance
CREATE OR REPLACE FUNCTION get_agent_performance(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  agent_id UUID,
  full_name TEXT,
  tenant_id UUID,
  total_tickets BIGINT,
  closed_tickets BIGINT,
  avg_resolution_min NUMERIC,
  avg_satisfaction NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se usuário tem acesso
  IF NOT (has_role(auth.uid(), 'super_admin') OR has_tenant_access(auth.uid(), COALESCE(p_tenant_id, (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)))) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Retornar dados filtrados
  RETURN QUERY
  SELECT 
    ap.agent_id,
    ap.full_name,
    ap.tenant_id,
    ap.total_tickets,
    ap.closed_tickets,
    ap.avg_resolution_min,
    ap.avg_satisfaction
  FROM agent_performance ap
  WHERE 
    CASE 
      WHEN has_role(auth.uid(), 'super_admin') THEN TRUE
      ELSE ap.tenant_id = COALESCE(p_tenant_id, (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1))
    END;
END;
$$;