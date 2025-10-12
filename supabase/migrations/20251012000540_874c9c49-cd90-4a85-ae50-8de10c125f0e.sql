-- Create plans table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  max_users INTEGER,
  max_tickets INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_gateway TEXT,
  gateway_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_gateway TEXT NOT NULL,
  gateway_payment_id TEXT,
  gateway_response JSONB,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payment_gateways table for storing credentials
CREATE TABLE public.payment_gateways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  gateway_name TEXT NOT NULL,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, gateway_name)
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plans
CREATE POLICY "Super admins can manage all plans"
ON public.plans FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Tenant admins can manage their plans"
ON public.plans FOR ALL
USING (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can view plans in their tenant"
ON public.plans FOR SELECT
USING (has_tenant_access(auth.uid(), tenant_id) OR tenant_id IS NULL);

-- RLS Policies for subscriptions
CREATE POLICY "Tenant admins can manage their subscriptions"
ON public.subscriptions FOR ALL
USING (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can view subscriptions in their tenant"
ON public.subscriptions FOR SELECT
USING (has_tenant_access(auth.uid(), tenant_id));

-- RLS Policies for payments
CREATE POLICY "Tenant admins can manage their payments"
ON public.payments FOR ALL
USING (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can view payments in their tenant"
ON public.payments FOR SELECT
USING (has_tenant_access(auth.uid(), tenant_id));

-- RLS Policies for payment_gateways
CREATE POLICY "Tenant admins can manage their gateways"
ON public.payment_gateways FOR ALL
USING (has_role(auth.uid(), 'tenant_admin') AND has_tenant_access(auth.uid(), tenant_id));

-- Triggers for updated_at
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_gateways_updated_at
BEFORE UPDATE ON public.payment_gateways
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();