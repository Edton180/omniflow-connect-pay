-- Allow tenant admins to update their own tenant
CREATE POLICY "Tenant admins can update their tenant"
ON public.tenants
FOR UPDATE
USING (
  id IN (
    SELECT tenant_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'tenant_admin'
  )
);

-- Update profiles policy to allow tenant admins to manage users in their tenant
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;

CREATE POLICY "Users can view profiles in their tenant"
ON public.profiles
FOR SELECT
USING (
  has_tenant_access(auth.uid(), tenant_id) 
  OR (id = auth.uid())
  OR has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Tenant admins can update profiles in their tenant"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'tenant_admin') 
  AND has_tenant_access(auth.uid(), tenant_id)
);

CREATE POLICY "Tenant admins can insert profiles in their tenant"
ON public.profiles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'tenant_admin') 
  AND has_tenant_access(auth.uid(), tenant_id)
);