-- Allow users to insert their own super_admin role during setup
-- This is needed for the first super admin to be created
DROP POLICY IF EXISTS "Users can view roles in their tenant" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;

-- Policy to view own roles or roles in same tenant
CREATE POLICY "Users can view own roles or tenant roles"
ON public.user_roles
FOR SELECT
USING (
  user_id = auth.uid() 
  OR has_tenant_access(auth.uid(), tenant_id)
  OR has_role(auth.uid(), 'super_admin')
);

-- Allow users to create their own super_admin role if no super_admin exists yet
CREATE POLICY "Users can create own super_admin role during setup"
ON public.user_roles
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'super_admin' 
  AND tenant_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'super_admin'
  )
);

-- Allow users to create their own roles in a tenant (when invited)
CREATE POLICY "Users can create own tenant roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND tenant_id IS NOT NULL
);

-- Super admins can manage all roles
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Tenant admins can manage roles in their tenant
CREATE POLICY "Tenant admins can manage tenant roles"
ON public.user_roles
FOR ALL
USING (
  has_role(auth.uid(), 'tenant_admin') 
  AND has_tenant_access(auth.uid(), tenant_id)
);

-- Allow users to delete their own roles
CREATE POLICY "Users can delete own roles"
ON public.user_roles
FOR DELETE
USING (user_id = auth.uid());

-- Allow users to update their own roles
CREATE POLICY "Users can update own roles"  
ON public.user_roles
FOR UPDATE
USING (user_id = auth.uid());