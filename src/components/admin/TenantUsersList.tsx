import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users as UsersIcon } from "lucide-react";

interface TenantUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  roles: Array<{ role: string }>;
}

interface TenantUsersListProps {
  tenantId: string;
  tenantName: string;
}

export const TenantUsersList = ({ tenantId, tenantName }: TenantUsersListProps) => {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantUsers();
  }, [tenantId]);

  const fetchTenantUsers = async () => {
    setLoading(true);
    try {
      console.log('🔍 Buscando usuários do tenant:', tenantId);
      
      // Buscar usuários via RPC function
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_users_with_emails')
        .eq('tenant_id', tenantId);

      if (usersError) throw usersError;

      // Buscar roles para cada usuário
      const usersWithRoles = await Promise.all(
        (usersData || []).map(async (userData) => {
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userData.id)
            .eq("tenant_id", tenantId);

          // Buscar avatar do profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", userData.id)
            .single();

          return {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            phone: userData.phone,
            avatar_url: profileData?.avatar_url,
            roles: rolesData || [],
          };
        })
      );

      console.log('✅ Usuários do tenant carregados:', usersWithRoles.length);
      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('❌ Erro ao buscar usuários do tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'tenant_admin':
        return 'default';
      case 'agent':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'tenant_admin':
        return 'Admin';
      case 'agent':
        return 'Agente';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5" />
          Usuários de {tenantName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum usuário encontrado nesta empresa
          </p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback>{user.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.phone && (
                      <p className="text-xs text-muted-foreground">{user.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {user.roles.map((role, idx) => (
                    <Badge key={idx} variant={getRoleBadgeVariant(role.role)}>
                      {getRoleLabel(role.role)}
                    </Badge>
                  ))}
                  {user.roles.length === 0 && (
                    <Badge variant="outline">Sem Papel</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};