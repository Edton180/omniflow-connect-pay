
-- Corrigir a função get_users_with_emails para retornar todos os usuários corretamente
DROP FUNCTION IF EXISTS public.get_users_with_emails();

CREATE OR REPLACE FUNCTION public.get_users_with_emails()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  phone text,
  tenant_id uuid,
  tenant_name text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(
      au.email,
      au.raw_user_meta_data->>'email',
      'user_' || SUBSTRING(p.id::text, 1, 8) || '@system.local'
    ) as email,
    p.full_name,
    p.phone,
    p.tenant_id,
    t.name as tenant_name,
    p.created_at
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  LEFT JOIN tenants t ON p.tenant_id = t.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Recriar view para ranking de avaliações
DROP VIEW IF EXISTS evaluation_rankings;

CREATE VIEW evaluation_rankings AS
SELECT 
  e.agent_id,
  e.tenant_id,
  p.full_name as agent_name,
  COUNT(*) as total_evaluations,
  AVG(e.score)::numeric(3,2) as average_score,
  COUNT(CASE WHEN e.score = 5 THEN 1 END) as excellent_count,
  COUNT(CASE WHEN e.score >= 3 THEN 1 END) as good_count,
  COUNT(CASE WHEN e.score < 3 THEN 1 END) as poor_count
FROM evaluations e
LEFT JOIN profiles p ON e.agent_id = p.id
WHERE e.agent_id IS NOT NULL
GROUP BY e.agent_id, e.tenant_id, p.full_name;
