-- Drop the functions with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.has_tenant_access(uuid, uuid) CASCADE;

-- Convert the role column from app_role enum to TEXT
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE TEXT;

-- Add check constraint to ensure valid roles
ALTER TABLE public.user_roles 
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles 
  ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('super_admin', 'tenant_admin', 'manager', 'agent', 'user'));

-- Recreate the has_role function with TEXT parameter
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Recreate has_tenant_access function
CREATE OR REPLACE FUNCTION public.has_tenant_access(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.tenant_id = _tenant_id
  ) OR public.has_role(_user_id, 'super_admin')
$$;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view their tenant" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can manage tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles in their tenant" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view queues in their tenant" ON public.queues;
DROP POLICY IF EXISTS "Tenant admins can manage queues" ON public.queues;
DROP POLICY IF EXISTS "Users can view contacts in their tenant" ON public.contacts;
DROP POLICY IF EXISTS "Users can manage contacts in their tenant" ON public.contacts;
DROP POLICY IF EXISTS "Users can view tickets in their tenant" ON public.tickets;
DROP POLICY IF EXISTS "Users can manage tickets in their tenant" ON public.tickets;
DROP POLICY IF EXISTS "Users can view messages for tickets in their tenant" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages for tickets in their tenant" ON public.messages;

-- Recreate RLS Policies for tenants
CREATE POLICY "Super admins can view all tenants"
  ON public.tenants FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their tenant"
  ON public.tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM public.user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage tenants"
  ON public.tenants FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Recreate RLS Policies for profiles
CREATE POLICY "Users can view profiles in their tenant"
  ON public.profiles FOR SELECT
  USING (
    public.has_tenant_access(auth.uid(), tenant_id)
    OR id = auth.uid()
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Recreate RLS Policies for user_roles
CREATE POLICY "Super admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view roles in their tenant"
  ON public.user_roles FOR SELECT
  USING (
    public.has_tenant_access(auth.uid(), tenant_id)
    OR user_id = auth.uid()
  );

-- Recreate RLS Policies for queues
CREATE POLICY "Users can view queues in their tenant"
  ON public.queues FOR SELECT
  USING (public.has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can manage queues"
  ON public.queues FOR ALL
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR (
      public.has_role(auth.uid(), 'tenant_admin')
      AND public.has_tenant_access(auth.uid(), tenant_id)
    )
  );

-- Recreate RLS Policies for contacts
CREATE POLICY "Users can view contacts in their tenant"
  ON public.contacts FOR SELECT
  USING (public.has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can manage contacts in their tenant"
  ON public.contacts FOR ALL
  USING (public.has_tenant_access(auth.uid(), tenant_id));

-- Recreate RLS Policies for tickets
CREATE POLICY "Users can view tickets in their tenant"
  ON public.tickets FOR SELECT
  USING (public.has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can manage tickets in their tenant"
  ON public.tickets FOR ALL
  USING (public.has_tenant_access(auth.uid(), tenant_id));

-- Recreate RLS Policies for messages
CREATE POLICY "Users can view messages for tickets in their tenant"
  ON public.messages FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM public.tickets
      WHERE public.has_tenant_access(auth.uid(), tenant_id)
    )
  );

CREATE POLICY "Users can create messages for tickets in their tenant"
  ON public.messages FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.tickets
      WHERE public.has_tenant_access(auth.uid(), tenant_id)
    )
  );