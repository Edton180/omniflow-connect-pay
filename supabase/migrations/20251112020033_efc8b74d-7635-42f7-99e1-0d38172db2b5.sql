-- Criar função para buscar usuários com emails reais (segura para uso no frontend)
CREATE OR REPLACE FUNCTION get_users_with_emails()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  tenant_id UUID,
  tenant_name TEXT,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(u.email, 'user_' || SUBSTRING(p.id::text, 1, 8) || '@system.local') as email,
    p.full_name,
    p.phone,
    p.tenant_id,
    t.name as tenant_name,
    p.created_at
  FROM profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN tenants t ON p.tenant_id = t.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Permitir que usuários autenticados chamem essa função
GRANT EXECUTE ON FUNCTION get_users_with_emails() TO authenticated;