import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Edit, Copy, Key } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentSecretsTab } from '@/components/settings/PaymentSecretsTab';

export default function Settings() {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const [loading, setLoading] = useState(false);
  const isSuperAdmin = roles.some(r => r.role === 'super_admin');
  const [settings, setSettings] = useState({
    siteName: 'OmniFlow',
    siteDescription: 'Plataforma de atendimento multi-tenant',
    maintenanceMode: false,
    allowSignups: true,
    requireEmailVerification: false,
    maxTenantsPerPlan: 100,
    sessionTimeout: 30,
    webhookUrl: '',
    customDomain: '',
    serverIp: '',
  });

  useEffect(() => {
    if (isSuperAdmin) {
      loadSettings();
    }
  }, [isSuperAdmin]);

  const loadSettings = async () => {
    try {
      const webhookUrl = `${window.location.origin}/api/webhooks`;
      
      // Buscar IP do servidor
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const serverIp = data.ip;
      
      setSettings(prev => ({ 
        ...prev, 
        webhookUrl,
        serverIp 
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save settings to database or localStorage
      localStorage.setItem('omniflow_settings', JSON.stringify(settings));
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência!');
  };

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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações globais da plataforma
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="auth">Autenticação</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="payment-secrets">Secrets de Pagamento</TabsTrigger>}
          </TabsList>

          <TabsContent value="general" className="space-y-6">{isSuperAdmin && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Webhook URL</CardTitle>
                    <CardDescription>URL para receber notificações de eventos do sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={settings.webhookUrl}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(settings.webhookUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use esta URL para configurar webhooks nos gateways de pagamento e canais de comunicação
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>IP do Servidor</CardTitle>
                    <CardDescription>IP público para apontamento de domínio</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={settings.serverIp || 'Carregando...'}
                        readOnly
                        className="flex-1 font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(settings.serverIp)}
                        disabled={!settings.serverIp}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aponte seu domínio para este IP usando um registro A
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Domínio Customizado</CardTitle>
                    <CardDescription>Configure o domínio do seu SaaS</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customDomain">Domínio</Label>
                      <Input
                        id="customDomain"
                        value={settings.customDomain}
                        onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
                        placeholder="seu-dominio.com.br"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Após configurar, aponte seu domínio para o IP do servidor
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Landing Page</CardTitle>
                    <CardDescription>Edite a página inicial customizável do sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/landing-page-editor')}
                      className="w-full"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Landing Page
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
                <CardDescription>Configurações básicas do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nome do Sistema</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) =>
                      setSettings({ ...settings, siteName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Descrição</Label>
                  <Input
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) =>
                      setSettings({ ...settings, siteDescription: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sistema</CardTitle>
                <CardDescription>Configurações avançadas do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo Manutenção</Label>
                    <p className="text-sm text-muted-foreground">
                      Desabilita acesso ao sistema para usuários
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, maintenanceMode: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTenants">Máximo de Tenants por Plano</Label>
                  <Input
                    id="maxTenants"
                    type="number"
                    value={settings.maxTenantsPerPlan}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maxTenantsPerPlan: parseInt(e.target.value) || 100,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {isSuperAdmin && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                  <CardDescription>Ações irreversíveis do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Reset Completo do Sistema</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Remove todos os dados do sistema incluindo usuários, tenants e configurações.
                      Esta ação não pode ser desfeita!
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => navigate('/system-reset')}
                      className="w-full"
                    >
                      🔧 Reset Completo do Sistema
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </TabsContent>

          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Autenticação</CardTitle>
                <CardDescription>Configurações de acesso e segurança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir Cadastros</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que novos usuários se cadastrem
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowSignups}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, allowSignups: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Verificação de Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Requer verificação de email no cadastro
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, requireEmailVerification: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sessionTimeout: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="payment-secrets">
              <PaymentSecretsTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
