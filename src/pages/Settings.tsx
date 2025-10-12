import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'OmniFlow',
    siteDescription: 'Plataforma de atendimento multi-tenant',
    maintenanceMode: false,
    allowSignups: true,
    requireEmailVerification: false,
    maxTenantsPerPlan: 100,
    sessionTimeout: 30,
  });

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
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

        <div className="space-y-6">
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

          <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </div>
  );
}
