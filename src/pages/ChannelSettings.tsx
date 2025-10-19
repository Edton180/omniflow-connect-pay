import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Settings, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChannelConfig {
  id?: string;
  config_type: string;
  api_url: string;
  api_key_encrypted: string;
  is_active: boolean;
}

export default function ChannelSettings() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  const [evolutionConfig, setEvolutionConfig] = useState<ChannelConfig>({
    config_type: 'evolution_api',
    api_url: '',
    api_key_encrypted: '',
    is_active: false,
  });

  const [telegramConfig, setTelegramConfig] = useState<ChannelConfig>({
    config_type: 'telegram',
    api_url: '',
    api_key_encrypted: '',
    is_active: false,
  });

  useEffect(() => {
    loadConfigs();
  }, [session]);

  const loadConfigs = async () => {
    if (!session?.user?.id) return;

    try {
      // Get tenant_id
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", session.user.id)
        .single();

      if (!userRole?.tenant_id) return;
      setTenantId(userRole.tenant_id);

      // Load configs
      const { data: configs } = await supabase
        .from("channel_configs")
        .select("*")
        .eq("tenant_id", userRole.tenant_id);

      if (configs) {
        const evolutionCfg = configs.find(c => c.config_type === 'evolution_api');
        const telegramCfg = configs.find(c => c.config_type === 'telegram');

        if (evolutionCfg) setEvolutionConfig(evolutionCfg as any);
        if (telegramCfg) setTelegramConfig(telegramCfg as any);
      }
    } catch (error) {
      console.error("Error loading configs:", error);
    }
  };

  const saveConfig = async (config: ChannelConfig) => {
    if (!tenantId) {
      toast.error("Tenant não identificado");
      return;
    }

    setLoading(true);
    try {
      const configData = {
        tenant_id: tenantId,
        config_type: config.config_type,
        api_url: config.api_url,
        api_key_encrypted: config.api_key_encrypted,
        is_active: config.is_active,
      };

      if (config.id) {
        // Update
        const { error } = await supabase
          .from("channel_configs")
          .update(configData)
          .eq("id", config.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("channel_configs")
          .insert(configData);

        if (error) throw error;
      }

      toast.success("Configuração salva com sucesso!");
      await loadConfigs();
    } catch (error: any) {
      console.error("Error saving config:", error);
      toast.error("Erro ao salvar configuração: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/channels")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white shadow-glow">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Configurações de Canais</h1>
              <p className="text-xs text-muted-foreground">Configure as credenciais dos seus canais</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Configure as credenciais dos canais para habilitar as integrações. Estas informações são criptografadas e armazenadas com segurança.
          </AlertDescription>
        </Alert>

        {/* Evolution API Config */}
        <Card>
          <CardHeader>
            <CardTitle>Evolution API</CardTitle>
            <CardDescription>
              Configure sua instância da Evolution API para conectar ao WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evolution-url">URL da API</Label>
              <Input
                id="evolution-url"
                placeholder="https://api.evolution.com"
                value={evolutionConfig.api_url}
                onChange={(e) => setEvolutionConfig({ ...evolutionConfig, api_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evolution-key">API Key</Label>
              <Input
                id="evolution-key"
                type="password"
                placeholder="Sua chave da Evolution API"
                value={evolutionConfig.api_key_encrypted}
                onChange={(e) => setEvolutionConfig({ ...evolutionConfig, api_key_encrypted: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="evolution-active"
                checked={evolutionConfig.is_active}
                onCheckedChange={(checked) => setEvolutionConfig({ ...evolutionConfig, is_active: checked })}
              />
              <Label htmlFor="evolution-active">Ativar Evolution API</Label>
            </div>

            <Button
              onClick={() => saveConfig(evolutionConfig)}
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Configuração
            </Button>
          </CardContent>
        </Card>

        {/* Telegram Config */}
        <Card>
          <CardHeader>
            <CardTitle>Telegram Bot</CardTitle>
            <CardDescription>
              Configure seu bot do Telegram para receber mensagens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegram-token">Bot Token</Label>
              <Input
                id="telegram-token"
                type="password"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={telegramConfig.api_key_encrypted}
                onChange={(e) => setTelegramConfig({ ...telegramConfig, api_key_encrypted: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Obtenha seu token com o @BotFather no Telegram
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="telegram-active"
                checked={telegramConfig.is_active}
                onCheckedChange={(checked) => setTelegramConfig({ ...telegramConfig, is_active: checked })}
              />
              <Label htmlFor="telegram-active">Ativar Telegram</Label>
            </div>

            <Button
              onClick={() => saveConfig(telegramConfig)}
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Configuração
            </Button>
          </CardContent>
        </Card>

        <div className="p-4 bg-accent/10 rounded-lg">
          <h3 className="font-semibold mb-2">Importante:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• As credenciais são armazenadas com criptografia</li>
            <li>• Configure as credenciais antes de conectar os canais</li>
            <li>• Para Evolution API, você precisa de uma instância própria</li>
            <li>• Para Telegram, crie um bot com @BotFather</li>
          </ul>
        </div>
      </div>
    </div>
  );
}