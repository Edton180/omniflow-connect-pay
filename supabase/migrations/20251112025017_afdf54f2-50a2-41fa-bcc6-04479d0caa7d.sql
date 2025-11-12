-- Fix get_users_with_emails function type mismatch
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
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(
      au.email::text,
      (au.raw_user_meta_data->>'email')::text,
      ('user_' || SUBSTRING(p.id::text, 1, 8) || '@system.local')::text
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
$function$;