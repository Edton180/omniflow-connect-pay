import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserManagement } from '@/components/admin/UserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoicesContent } from '@/components/invoices/InvoicesContent';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { AIConfigSection } from '@/components/settings/AIConfigSection';
import { EvaluationSettingsTab } from '@/components/settings/EvaluationSettingsTab';
import { Switch } from '@/components/ui/switch';

export default function TenantSettings() {
  const { user, roles } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    primary_color: '#8B5CF6',
    secondary_color: '#3B82F6',
    cnpj_cpf: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    allow_agent_signature: true,
    force_agent_signature: false,
  });

  useEffect(() => {
    fetchTenant();
  }, [user, roles]);

  const fetchTenant = async () => {
    if (!user || !roles || roles.length === 0) return;

    setLoading(true);
    try {
      const tenantRole = roles.find((r) => r.tenant_id);
      if (!tenantRole?.tenant_id) {
        toast.error('Você não está associado a nenhuma empresa');
        return;
      }

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantRole.tenant_id)
        .single();

      if (error) throw error;

      setTenant(data);
      setFormData({
        name: data.name,
        logo_url: data.logo_url || '',
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        cnpj_cpf: data.cnpj_cpf || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip_code: data.zip_code || '',
        allow_agent_signature: data.allow_agent_signature ?? true,
        force_agent_signature: data.force_agent_signature ?? false,
      });
    } catch (error: any) {
      toast.error('Erro ao carregar dados da empresa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setSaving(true);
    try {
      const oldDomain = tenant.custom_domain;
      
      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
          logo_url: formData.logo_url || null,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          cnpj_cpf: formData.cnpj_cpf || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zip_code || null,
          allow_agent_signature: formData.allow_agent_signature,
          force_agent_signature: formData.force_agent_signature,
        })
        .eq('id', tenant.id);

      if (error) throw error;

      // Se o domínio foi alterado, atualizar webhook do Telegram
      const newDomain = formData.logo_url || tenant.custom_domain;
      if (oldDomain !== newDomain && newDomain) {
        try {
          // Atualizar webhook do Telegram via edge function
          await supabase.functions.invoke('telegram-webhook', {
            body: {
              action: 'update_webhook',
              domain: newDomain,
              tenant_id: tenant.id
            }
          });
        } catch (webhookError) {
          console.error('Error updating webhook:', webhookError);
          // Não bloqueia o salvamento se webhook falhar
        }
      }

      toast.success('Configurações atualizadas com sucesso!');
      fetchTenant();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configurações da Empresa</h1>
          <p className="text-muted-foreground">Gerencie as configurações e usuários da sua empresa</p>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList>
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="ai">Assistentes IA</TabsTrigger>
            <TabsTrigger value="evaluations">Avaliações</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>Atualize as informações básicas da sua empresa</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Empresa *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnpj_cpf">CNPJ / CPF *</Label>
                      <Input
                        id="cnpj_cpf"
                        value={formData.cnpj_cpf}
                        onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })}
                        placeholder="00.000.000/0000-00"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo_url">URL do Logo</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço Completo *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, número, complemento"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="UF"
                        maxLength={2}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zip_code">CEP *</Label>
                      <Input
                        id="zip_code"
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        placeholder="00000-000"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Cor Primária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          type="color"
                          value={formData.primary_color}
                          onChange={(e) =>
                            setFormData({ ...formData, primary_color: e.target.value })
                          }
                          className="w-20"
                        />
                        <Input
                          value={formData.primary_color}
                          onChange={(e) =>
                            setFormData({ ...formData, primary_color: e.target.value })
                          }
                          placeholder="#8B5CF6"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Cor Secundária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary_color"
                          type="color"
                          value={formData.secondary_color}
                          onChange={(e) =>
                            setFormData({ ...formData, secondary_color: e.target.value })
                          }
                          className="w-20"
                        />
                        <Input
                          value={formData.secondary_color}
                          onChange={(e) =>
                            setFormData({ ...formData, secondary_color: e.target.value })
                          }
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Configurações de Atendimento</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="allow_agent_signature" className="text-base">
                            Permitir assinatura do agente
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Permite que agentes adicionem suas assinaturas automaticamente nas mensagens
                          </p>
                        </div>
                        <Switch
                          id="allow_agent_signature"
                          checked={formData.allow_agent_signature}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, allow_agent_signature: checked })
                          }
                        />
                      </div>

                      {formData.allow_agent_signature && (
                        <div className="flex items-center justify-between space-x-2 pl-4 border-l-2 border-muted">
                          <div className="space-y-0.5">
                            <Label htmlFor="force_agent_signature" className="text-base">
                              Forçar assinatura sempre ativa
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Quando ativado, agentes não podem desativar a assinatura - ela sempre será incluída
                            </p>
                          </div>
                          <Switch
                            id="force_agent_signature"
                            checked={formData.force_agent_signature}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, force_agent_signature: checked })
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="ai">
            <AIConfigSection />
          </TabsContent>

          <TabsContent value="evaluations">
            {tenant && <EvaluationSettingsTab tenantId={tenant.id} />}
          </TabsContent>

          <TabsContent value="invoices">
            <InvoicesContent />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
