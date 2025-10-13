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