import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Plus, Pencil, Trash2, Mail, Shield, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserWithProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  roles: Array<{ role: string; tenant_id: string | null }>;
}

export const UserManagement = () => {
  const { toast } = useToast();
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithProfile | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    tenant_id: "",
    role: "agent",
    queue_ids: [] as string[],
    queue_role: "agent" as "agent" | "supervisor" | "admin",
    can_takeover_ai: false,
  });
  const [queues, setQueues] = useState<any[]>([]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar empresas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchQueues = async () => {
    try {
      const { data, error } = await supabase
        .from("queues")
        .select("id, name, color")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setQueues(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar filas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('🔍 Carregando usuários. Super Admin?', isSuperAdmin);
      
      // Buscar todos os usuários via RPC (nova função corrigida)
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_users_with_emails');

      if (usersError) {
        console.error('❌ Erro ao buscar usuários:', usersError);
        throw usersError;
      }

      console.log('📋 Usuários retornados do RPC:', usersData?.length);
      
      // Filtrar manualmente se não for super admin
      let filteredUsers = usersData || [];
      
      if (!isSuperAdmin) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('tenant_id')
          .eq('user_id', user.id);
          
        const userTenantId = userRoles?.[0]?.tenant_id;
        
        if (userTenantId) {
          filteredUsers = usersData.filter((u: any) => u.tenant_id === userTenantId);
          console.log('🔍 Filtrando por tenant:', userTenantId, 'Resultados:', filteredUsers.length);
        }
      } else {
        console.log('✅ Super Admin - Mostrando TODOS os', filteredUsers.length, 'usuários do sistema');
      }
      
      console.log('✅ Usuários finais a exibir:', filteredUsers.length);

      // Buscar roles para cada usuário
      const usersWithRoles = await Promise.all(
        filteredUsers.map(async (userData: any) => {
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role, tenant_id")
            .eq("user_id", userData.id);

          return {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            phone: userData.phone,
            tenant_id: userData.tenant_id,
            tenant_name: userData.tenant_name,
            roles: rolesData || [],
          };
        })
      );

      console.log('👥 Usuários com roles processados:', usersWithRoles.length);
      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('❌ Erro completo ao carregar usuários:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTenants();
    fetchQueues();
  }, []);

  const handleCreate = () => {
    setSelectedUser(null);
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      password: "",
      tenant_id: "",
      role: "agent",
      queue_ids: [],
      queue_role: "agent",
      can_takeover_ai: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = async (user: UserWithProfile) => {
    setSelectedUser(user);
    
    // Carregar filas do usuário
    const { data: userQueues } = await supabase
      .from("user_queues")
      .select("queue_id, role, can_takeover_ai")
      .eq("user_id", user.id);
    
    const queueIds = userQueues?.map(q => q.queue_id) || [];
    const firstQueue = userQueues?.[0];
    
    setFormData({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      tenant_id: user.tenant_id || "",
      role: user.roles[0]?.role || "agent",
      queue_ids: queueIds,
      queue_role: (firstQueue?.role as "agent" | "supervisor" | "admin") || "agent",
      can_takeover_ai: firstQueue?.can_takeover_ai || false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar tenant_id se não for super admin criando outro super admin
    if (!selectedUser && formData.role !== 'super_admin' && !formData.tenant_id) {
      toast({
        title: "Empresa Obrigatória",
        description: "Selecione uma empresa para associar o usuário",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (selectedUser) {
        // Update existing user
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            phone: formData.phone || null,
            tenant_id: formData.tenant_id || null,
          })
          .eq("id", selectedUser.id);

        if (profileError) throw profileError;

        // Update role
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", selectedUser.id);

        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: selectedUser.id,
            tenant_id: formData.tenant_id || null,
            role: formData.role,
          });

        if (roleError) throw roleError;

        // Update queue assignments
        await supabase
          .from("user_queues")
          .delete()
          .eq("user_id", selectedUser.id);

        if (formData.queue_ids.length > 0) {
          const queueAssignments = formData.queue_ids.map(queue_id => ({
            user_id: selectedUser.id,
            queue_id: queue_id,
            role: formData.queue_role,
            can_takeover_ai: formData.can_takeover_ai,
            is_active: true,
          }));

          const { error: queueError } = await supabase
            .from("user_queues")
            .insert(queueAssignments);

          if (queueError) throw queueError;
        }

        toast({
          title: "Usuário atualizado",
          description: "As informações do usuário foram atualizadas com sucesso.",
        });
      } else {
        // Create new user via edge function
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            phone: formData.phone || null,
            tenant_id: formData.tenant_id || null,
            role: formData.role,
            queue_ids: formData.queue_ids,
            queue_role: formData.queue_role,
            can_takeover_ai: formData.can_takeover_ai,
          }
        });

        if (error) {
          console.error("Error creating user:", error);
          throw new Error(error.message || "Erro ao criar usuário");
        }
        
        if (data?.error) {
          console.error("Function returned error:", data.error);
          throw new Error(data.error);
        }
        
        if (!data?.success) {
          console.error("Function returned success=false:", data);
          throw new Error(data?.error || "Erro ao criar usuário");
        }

        toast({
          title: "Usuário criado",
          description: "O novo usuário foi criado com sucesso.",
        });
      }

      setDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (user: UserWithProfile) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userToDelete.id);

      if (error) throw error;

      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
          <p className="text-muted-foreground">
            {isSuperAdmin ? "Todos os usuários do sistema" : "Usuários da sua empresa"}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="gradient-card hover-scale">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {user.full_name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {user.id !== currentUser?.id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteClick(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {user.phone && (
                <p className="text-sm text-muted-foreground">
                  📱 {user.phone}
                </p>
              )}
              {user.tenant_name && (
                <p className="text-sm font-medium text-primary">
                  🏢 {user.tenant_name}
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
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum usuário encontrado</p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Usuário
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? "Atualize as informações do usuário"
                : "Adicione um novo usuário ao sistema"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            {!selectedUser && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant_id">
                Empresa {!selectedUser && <span className="text-destructive">*</span>}
              </Label>
              <Select
                value={formData.tenant_id}
                onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                required={!selectedUser}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedUser && tenants.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma empresa cadastrada. Crie uma empresa primeiro.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                  <SelectItem value="tenant_admin">Admin da Empresa</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="queues">Filas de Atendimento</Label>
              <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                {queues.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma fila disponível</p>
                ) : (
                  queues.map((queue) => (
                    <div key={queue.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`queue-${queue.id}`}
                        checked={formData.queue_ids.includes(queue.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              queue_ids: [...formData.queue_ids, queue.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              queue_ids: formData.queue_ids.filter(id => id !== queue.id)
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label
                        htmlFor={`queue-${queue.id}`}
                        className="text-sm flex items-center gap-2 cursor-pointer"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: queue.color }}
                        />
                        {queue.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {formData.queue_ids.length > 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="queue_role">Função nas Filas</Label>
                  <Select
                    value={formData.queue_role}
                    onValueChange={(value: any) => setFormData({ ...formData, queue_role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Atendente</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="can_takeover_ai"
                    checked={formData.can_takeover_ai}
                    onChange={(e) => setFormData({ ...formData, can_takeover_ai: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="can_takeover_ai" className="cursor-pointer">
                    Pode assumir conversas do ChatGPT
                  </Label>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {selectedUser ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.full_name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};