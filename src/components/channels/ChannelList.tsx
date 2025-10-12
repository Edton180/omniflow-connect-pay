import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelCard } from "./ChannelCard";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ChannelList = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    type: "whatsapp",
    config: {} as Record<string, string>,
  });

  useEffect(() => {
    if (session?.user) {
      loadChannels();
    }
  }, [session]);

  const loadChannels = async () => {
    try {
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", session?.user?.id)
        .maybeSingle();

      if (roleError) throw roleError;

      if (!userRole?.tenant_id) {
        setLoading(false);
        setChannels([]);
        return;
      }

      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("tenant_id", userRole.tenant_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setChannels(data || []);
    } catch (error: any) {
      console.error("Error loading channels:", error);
      toast({
        title: "Erro ao carregar canais",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableChannelTypes = [
    {
      type: "whatsapp",
      name: "WhatsApp",
      icon: "message-circle",
      description: "WhatsApp Business API",
    },
    {
      type: "email",
      name: "Email",
      icon: "mail",
      description: "Atendimento por Email",
    },
    {
      type: "telegram",
      name: "Telegram",
      icon: "send",
      description: "Telegram Bot",
    },
    {
      type: "instagram",
      name: "Instagram",
      icon: "instagram",
      description: "Instagram Direct Messages",
    },
    {
      type: "facebook",
      name: "Facebook",
      icon: "facebook",
      description: "Facebook Messenger",
    },
    {
      type: "webchat",
      name: "Web Chat",
      icon: "globe",
      description: "Chat integrado ao seu site",
    },
  ];

  const handleConfigure = (channel: any) => {
    setSelectedChannel(channel);
    setFormData({
      name: channel.name || "",
      type: channel.type || "whatsapp",
      config: channel.config || {},
    });
    setDialogOpen(true);
  };

  const handleNewChannel = () => {
    setSelectedChannel(null);
    setFormData({
      name: "",
      type: "whatsapp",
      config: {},
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", session?.user?.id)
        .maybeSingle();

      if (roleError) throw roleError;

      if (!userRole?.tenant_id) {
        toast({
          title: "Erro",
          description: "Você precisa estar associado a uma empresa para criar canais",
          variant: "destructive",
        });
        return;
      }

      const channelData = {
        name: formData.name,
        type: formData.type,
        config: formData.config,
        tenant_id: userRole.tenant_id,
        status: "active",
      };

      if (selectedChannel) {
        const { error } = await supabase
          .from("channels")
          .update(channelData)
          .eq("id", selectedChannel.id);

        if (error) throw error;

        toast({
          title: "Canal atualizado",
          description: `Canal ${formData.name} atualizado com sucesso.`,
        });
      } else {
        const { error } = await supabase
          .from("channels")
          .insert([channelData]);

        if (error) throw error;

        toast({
          title: "Canal criado",
          description: `Canal ${formData.name} criado com sucesso.`,
        });
      }

      setDialogOpen(false);
      loadChannels();
    } catch (error: any) {
      console.error("Error saving channel:", error);
      toast({
        title: "Erro ao salvar canal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Carregando canais...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleNewChannel}>
          Novo Canal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {channels.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={{
              ...channel,
              connected: channel.status === "active",
              icon: channel.type,
              description: availableChannelTypes.find((t) => t.type === channel.type)?.description || "",
            }}
            onConfigure={() => handleConfigure(channel)}
          />
        ))}
      </div>

      <Card className="gradient-card">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Conecte seus canais de atendimento</h3>
            <p className="text-sm text-muted-foreground">
              Configure as integrações com WhatsApp, Instagram, Facebook e outros canais para centralizar
              seu atendimento em um único lugar.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar {selectedChannel?.name}</DialogTitle>
            <DialogDescription>
              Configure as credenciais e parâmetros de conexão
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credentials">Credenciais</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="channel_name">Nome do Canal</Label>
                <Input
                  id="channel_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: WhatsApp Principal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel_type">Tipo de Canal</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  disabled={!!selectedChannel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChannelTypes.map((type) => (
                      <SelectItem key={type.type} value={type.type}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "whatsapp" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número do WhatsApp</Label>
                    <Input
                      id="phone"
                      value={formData.config.phone || ""}
                      onChange={(e) => handleConfigChange("phone", e.target.value)}
                      placeholder="+55 11 99999-9999"
                      type="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                      id="api_key"
                      value={formData.config.api_key || ""}
                      onChange={(e) => handleConfigChange("api_key", e.target.value)}
                      placeholder="Sua chave de API do WhatsApp Business"
                      type="password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook">Webhook URL</Label>
                    <Input
                      id="webhook"
                      value={formData.config.webhook || ""}
                      onChange={(e) => handleConfigChange("webhook", e.target.value)}
                      placeholder="https://sua-api.com/webhook"
                      type="url"
                    />
                  </div>
                </>
              )}

              {formData.type === "email" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email_host">Servidor SMTP</Label>
                    <Input
                      id="email_host"
                      value={formData.config.smtp_host || ""}
                      onChange={(e) => handleConfigChange("smtp_host", e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_port">Porta</Label>
                    <Input
                      id="email_port"
                      value={formData.config.smtp_port || ""}
                      onChange={(e) => handleConfigChange("smtp_port", e.target.value)}
                      placeholder="587"
                      type="number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_user">Usuário</Label>
                    <Input
                      id="email_user"
                      value={formData.config.smtp_user || ""}
                      onChange={(e) => handleConfigChange("smtp_user", e.target.value)}
                      placeholder="seu-email@empresa.com"
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_pass">Senha</Label>
                    <Input
                      id="email_pass"
                      value={formData.config.smtp_password || ""}
                      onChange={(e) => handleConfigChange("smtp_password", e.target.value)}
                      placeholder="Senha do email"
                      type="password"
                    />
                  </div>
                </>
              )}

              {formData.type === "telegram" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="telegram_token">Bot Token</Label>
                    <Input
                      id="telegram_token"
                      value={formData.config.bot_token || ""}
                      onChange={(e) => handleConfigChange("bot_token", e.target.value)}
                      placeholder="Token do seu bot do Telegram"
                      type="password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telegram_webhook">Webhook URL</Label>
                    <Input
                      id="telegram_webhook"
                      value={formData.config.webhook_url || ""}
                      onChange={(e) => handleConfigChange("webhook_url", e.target.value)}
                      placeholder="https://sua-api.com/telegram-webhook"
                      type="url"
                    />
                  </div>
                </>
              )}

              {formData.type === "instagram" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_token">Access Token</Label>
                    <Input
                      id="instagram_token"
                      value={formData.config.access_token || ""}
                      onChange={(e) => handleConfigChange("access_token", e.target.value)}
                      placeholder="Seu token de acesso do Instagram"
                      type="password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="page_id">Page ID</Label>
                    <Input
                      id="page_id"
                      value={formData.config.page_id || ""}
                      onChange={(e) => handleConfigChange("page_id", e.target.value)}
                      placeholder="ID da sua página do Instagram"
                    />
                  </div>
                </>
              )}

              {formData.type === "facebook" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fb_token">Access Token</Label>
                    <Input
                      id="fb_token"
                      value={formData.config.access_token || ""}
                      onChange={(e) => handleConfigChange("access_token", e.target.value)}
                      placeholder="Seu token de acesso do Facebook"
                      type="password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fb_page_id">Page ID</Label>
                    <Input
                      id="fb_page_id"
                      value={formData.config.page_id || ""}
                      onChange={(e) => handleConfigChange("page_id", e.target.value)}
                      placeholder="ID da sua página do Facebook"
                    />
                  </div>
                </>
              )}

              {formData.type === "webchat" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    O Web Chat está sempre ativo. Copie o código abaixo e cole no seu site:
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <code className="text-xs">
                      {`<script src="https://seu-dominio.com/webchat.js"></script>`}
                    </code>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webchat_color">Cor Principal</Label>
                    <Input
                      id="webchat_color"
                      value={formData.config.primary_color || "#8B5CF6"}
                      onChange={(e) => handleConfigChange("primary_color", e.target.value)}
                      type="color"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="greeting">Mensagem de Saudação</Label>
                <Textarea
                  id="greeting"
                  value={formData.config.greeting_message || ""}
                  onChange={(e) => handleConfigChange("greeting_message", e.target.value)}
                  placeholder="Olá! Como posso ajudar?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto_reply">Resposta Automática</Label>
                <Textarea
                  id="auto_reply"
                  value={formData.config.auto_reply || ""}
                  onChange={(e) => handleConfigChange("auto_reply", e.target.value)}
                  placeholder="Obrigado por entrar em contato. Em breve retornaremos."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_hours">Horário de Atendimento</Label>
                <Input
                  id="business_hours"
                  value={formData.config.business_hours || ""}
                  onChange={(e) => handleConfigChange("business_hours", e.target.value)}
                  placeholder="Segunda a Sexta, 9h às 18h"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Configuração
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
