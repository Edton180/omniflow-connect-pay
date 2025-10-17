import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Bell, Volume2, FileImage, Mic, Smile } from "lucide-react";

interface ChatConfig {
  notifications: boolean;
  alerts_sound: boolean;
  file_max_mb: number;
  audio_messages: boolean;
  emoji_enabled: boolean;
}

export function ChatConfigTab({ tenantId }: { tenantId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ChatConfig>({
    notifications: true,
    alerts_sound: true,
    file_max_mb: 10,
    audio_messages: true,
    emoji_enabled: true,
  });

  useEffect(() => {
    loadConfig();
  }, [tenantId]);

  const loadConfig = async () => {
    try {
      const { data } = await supabase
        .from("tenants")
        .select("custom_css")
        .eq("id", tenantId)
        .single();

      if (data?.custom_css && typeof data.custom_css === 'object' && 'chat_config' in data.custom_css) {
        const chatConfig = (data.custom_css as any).chat_config;
        if (chatConfig) {
          setConfig(chatConfig);
        }
      }
    } catch (error) {
      console.error("Error loading config:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("custom_css")
        .eq("id", tenantId)
        .single();

      const existingCss = tenant?.custom_css && typeof tenant.custom_css === 'object' ? tenant.custom_css : {};
      
      const { error } = await supabase
        .from("tenants")
        .update({
          custom_css: {
            ...(existingCss as Record<string, any>),
            chat_config: config,
          } as any,
        })
        .eq("id", tenantId);

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações do chat foram atualizadas.",
      });
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Chat
          </CardTitle>
          <CardDescription>
            Personalize as preferências de comunicação interna
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="notifications">Notificações</Label>
            </div>
            <Switch
              id="notifications"
              checked={config.notifications}
              onCheckedChange={(checked) =>
                setConfig({ ...config, notifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="alerts_sound">Som de Alerta</Label>
            </div>
            <Switch
              id="alerts_sound"
              checked={config.alerts_sound}
              onCheckedChange={(checked) =>
                setConfig({ ...config, alerts_sound: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileImage className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="file_max">Tamanho Máximo de Arquivo (MB)</Label>
            </div>
            <Input
              id="file_max"
              type="number"
              min="1"
              max="50"
              value={config.file_max_mb}
              onChange={(e) =>
                setConfig({ ...config, file_max_mb: parseInt(e.target.value) || 10 })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="audio_messages">Mensagens de Áudio</Label>
            </div>
            <Switch
              id="audio_messages"
              checked={config.audio_messages}
              onCheckedChange={(checked) =>
                setConfig({ ...config, audio_messages: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smile className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="emoji_enabled">Emojis e Stickers</Label>
            </div>
            <Switch
              id="emoji_enabled"
              checked={config.emoji_enabled}
              onCheckedChange={(checked) =>
                setConfig({ ...config, emoji_enabled: checked })
              }
            />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
