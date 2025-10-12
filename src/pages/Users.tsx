import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface UserWithProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  roles: Array<{ role: string; tenant_id: string | null }>;
}

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role, tenant_id')
            .eq('user_id', profile.id);

          // Get user email from auth (we'll use a mock for now since we can't query auth.users directly)
          return {
            id: profile.id,
            email: 'user@example.com', // In production, this would come from auth metadata
            full_name: profile.full_name,
            phone: profile.phone,
            roles: rolesData || [],
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      super_admin: 'destructive',
      tenant_admin: 'default',
      manager: 'secondary',
      agent: 'secondary',
      user: 'secondary',
    };

    return (
      <Badge variant={variants[role] || 'secondary'}>
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os usuários do sistema
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user.id} className="gradient-card hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {user.full_name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.phone && (
                    <p className="text-sm text-muted-foreground">
                      📱 {user.phone}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((roleData, idx) => (
                      <div key={idx}>{getRoleBadge(roleData.role)}</div>
                    ))}
                    {user.roles.length === 0 && (
                      <Badge variant="secondary">SEM ROLE</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
