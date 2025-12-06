import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, LogOut, Globe, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useServerDetection } from "@/hooks/useServerDetection";

export default function WebChatSetup() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { domain, channelCode, loading: detecting } = useServerDetection(tenantId || undefined);
  
  const [settings, setSettings] = useState({
    welcome_message: "Olá! Como podemos ajudar?",
    theme_color: "#8B5CF6",
    position: "bottom-right",
    show_agent_name: true,
    auto_open: false,
  });

  useEffect(() => {
    loadTenantInfo();
  }, [user]);

  const loadTenantInfo = async () => {
    try {
      if (!user?.id) return;

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (userRole?.tenant_id) {
        setTenantId(userRole.tenant_id);
        loadSettings(userRole.tenant_id);
      }
    } catch (error: any) {
      console.error("Error loading tenant info:", error);
    }
  };

  const loadSettings = async (tid: string) => {
    try {
      const { data: channel } = await supabase
        .from("channels")
        .select("config")
        .eq("tenant_id", tid)
        .eq("type", "webchat")
        .maybeSingle();

      if (channel?.config) {
        const config = channel.config as any;
        setSettings({
          welcome_message: config.welcome_message || settings.welcome_message,
          theme_color: config.theme_color || settings.theme_color,
          position: config.position || settings.position,
          show_agent_name: config.show_agent_name ?? settings.show_agent_name,
          auto_open: config.auto_open ?? settings.auto_open,
        });
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
    }
  };

  const generateEmbedCode = () => {
    if (!tenantId) return "";

    // Usar a URL do Supabase para a API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://yfseeexwafzmezufwdxq.supabase.co";
    const projectUrl = window.location.origin;

    return `<!-- OmniFlow Web Chat -->
<script>
  (function() {
    window.omniflowConfig = {
      apiUrl: '${supabaseUrl}/functions/v1/webchat-webhook',
      tenantId: '${tenantId}',
      welcomeMessage: '${settings.welcome_message.replace(/'/g, "\\'")}',
      themeColor: '${settings.theme_color}',
      position: '${settings.position}',
      showAgentName: ${settings.show_agent_name},
      autoOpen: ${settings.auto_open}
    };
    
    var script = document.createElement('script');
    script.src = '${projectUrl}/webchat.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;
  };

  const embedCode = generateEmbedCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast({ title: "Código copiado!", description: "Cole no seu site antes do </body>" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      // Check if webchat channel exists
      const { data: existing } = await supabase
        .from("channels")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("type", "webchat")
        .maybeSingle();

      const channelData = {
        tenant_id: tenantId,
        name: "Web Chat",
        type: "webchat",
        status: "active",
        config: settings,
      };

      if (existing) {
        const { error } = await supabase
          .from("channels")
          .update({ config: settings })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("channels")
          .insert(channelData);

        if (error) throw error;
      }

      toast({ title: "Configurações salvas com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Web Chat</h1>
              <p className="text-xs text-foreground/60">Configure o chat para seu site</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detecção Automática</CardTitle>
              <CardDescription>
                Informações detectadas automaticamente do seu servidor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Domínio</Label>
                <Input value={domain || "Detectando..."} readOnly />
              </div>
              <div>
                <Label>Código do Canal</Label>
                <Input value={channelCode || "Gerando..."} readOnly />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personalização</CardTitle>
              <CardDescription>Customize a aparência do chat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Mensagem de Boas-vindas</Label>
                <Textarea
                  value={settings.welcome_message}
                  onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label>Cor do Tema</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.theme_color}
                    onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.theme_color}
                    onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar Nome do Atendente</Label>
                  <p className="text-xs text-muted-foreground">
                    Exibir quem está respondendo
                  </p>
                </div>
                <Switch
                  checked={settings.show_agent_name}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, show_agent_name: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Abrir Automaticamente</Label>
                  <p className="text-xs text-muted-foreground">
                    Chat abre ao carregar a página
                  </p>
                </div>
                <Switch
                  checked={settings.auto_open}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, auto_open: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Código de Instalação</CardTitle>
              <CardDescription>
                Cole este código no seu site antes do tag {`</body>`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  value={embedCode || "Aguardando detecção..."}
                  readOnly
                  rows={15}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                  disabled={!embedCode || detecting}
                >
                  {copied ? (
                    <><Check className="h-4 w-4 mr-1" />Copiado</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-1" />Copiar</>
                  )}
                </Button>
              </div>

              <div className="rounded-lg bg-primary/5 p-4 space-y-2">
                <h4 className="font-semibold text-sm">Como instalar:</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Copie o código acima</li>
                  <li>Abra o HTML do seu site</li>
                  <li>Cole o código antes do tag {`</body>`}</li>
                  <li>Salve e atualize seu site</li>
                  <li>O chat aparecerá automaticamente</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/channels")} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading || detecting} className="flex-1">
              {loading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
