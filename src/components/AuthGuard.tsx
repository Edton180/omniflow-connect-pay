import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
}

export const AuthGuard = ({ children, requireAuth = true, requiredRoles = [] }: AuthGuardProps) => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      // Prevenir acesso ao /setup se já existe super admin
      if (window.location.pathname === '/setup' && user) {
        const { data: existingSuperAdmin } = await supabase
          .from('user_roles')
          .select('id')
          .eq('role', 'super_admin')
          .maybeSingle();

        if (existingSuperAdmin) {
          navigate('/dashboard');
          setChecking(false);
          return;
        }
      }

      // Verificar status de assinatura overdue (exceto na própria página /payment-required)
      if (user && !window.location.pathname.includes('/payment-required') && !window.location.pathname.includes('/auth')) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userRole?.tenant_id) {
          const { data: tenant } = await supabase
            .from('tenants')
            .select('subscription_status, expiry_date')
            .eq('id', userRole.tenant_id)
            .single();

          // Bloquear se overdue ou expired com faturas pendentes
          if (tenant && (tenant.subscription_status === 'overdue' || tenant.subscription_status === 'expired')) {
            const { data: pendingInvoices } = await supabase
              .from('invoices')
              .select('id')
              .eq('tenant_id', userRole.tenant_id)
              .in('status', ['pending', 'overdue'])
              .limit(1);

            if (pendingInvoices && pendingInvoices.length > 0) {
              navigate('/payment-required');
              setChecking(false);
              return;
            }
          }
        }
      }

      if (!loading) {
        if (requireAuth && !user) {
          navigate('/auth');
        } else if (requiredRoles.length > 0 && roles) {
          const hasRequiredRole = requiredRoles.some(role => roles.some(r => r.role === role));
          if (!hasRequiredRole) {
            navigate('/dashboard');
          }
        }
      }
      setChecking(false);
    };

    checkSetup();
  }, [user, roles, loading, requireAuth, requiredRoles, navigate]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (requiredRoles.length > 0 && roles) {
    const hasRequiredRole = requiredRoles.some(role => roles.some(r => r.role === role));
    if (!hasRequiredRole) {
      return null;
    }
  }

  return <>{children}</>;
};