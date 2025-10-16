import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface RoleBasedViewProps {
  userRole: string | null;
  children: {
    admin: ReactNode;
    manager: ReactNode;
    restricted: ReactNode;
  };
}

export function RoleBasedCatalogView({ userRole, children }: RoleBasedViewProps) {
  const { toast } = useToast();

  if (!userRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Super admin and tenant admin have full edit access
  if (userRole === 'super_admin' || userRole === 'tenant_admin') {
    return <>{children.admin}</>;
  }

  // Manager has view-only access
  if (userRole === 'manager') {
    return <>{children.manager}</>;
  }

  // Agent and customer have no access
  toast({
    title: 'Sem permissão',
    description: 'Você não tem permissão para acessar esta área',
    variant: 'destructive',
  });
  
  return <Navigate to="/dashboard" replace />;
}
