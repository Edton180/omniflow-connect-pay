import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelCard } from "./ChannelCard";
import { BaileysConnection } from "./BaileysConnection";
import { BaileysSetupGuide } from "./BaileysSetupGuide";
import { EvolutionConnection } from "./EvolutionConnection";
import { QrCode, Trash2 } from "lucide-react";
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
  const { session, isSuperAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    type: "whatsapp",
    tenant_id: "",
    config: {} as Record<string, string>,
  });

  useEffect(() => {
    if (session?.user) {
      loadChannels();
      if (isSuperAdmin) {
        loadTenants();
      }
    }
  }, [session, isSuperAdmin]);

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      console.error("Error loading tenants:", error);
    }
  };

  const loadChannels = async () => {
    try {
      // Se for super_admin, carrega todos os canais
      if (isSuperAdmin) {
        const { data, error } = await supabase
          .from("channels")
          .select("*, tenants(name)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setChannels(data || []);
      } else {
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
        
        // Map whatsapp_baileys back to baileys-qr for display
        const mappedChannels = (data || []).map(channel => ({
          ...channel,
          type: channel.type === 'whatsapp_baileys' ? 'baileys-qr' : channel.type
        }));
        setChannels(mappedChannels);
      }
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
      type: "baileys-qr",
      name: "WhatsApp (Baileys QR)",
      icon: "qr-code",
      description: "Conexão via QR Code - Multi-dispositivo (Não oficial)",
      isBaileys: true,
    },
    {
      type: "evolution-api",
      name: "WhatsApp (Evolution API)",
      icon: "zap",
      description: "Conexão profissional via Evolution API (Não oficial)",
      isEvolution: true,
    },
    {
      type: "whatsapp",
      name: "WhatsApp Business API (WABA)",
      icon: "message-circle",
      description: "WhatsApp Business API Oficial da Meta",
    },
    {
      type: "telegram",
      name: "Telegram",
      icon: "send",
      description: "Telegram Bot oficial",
    },
    {
      type: "facebook",
      name: "Facebook Messenger",
      icon: "facebook",
      description: "Mensagens via Facebook",
    },
    {
      type: "instagram",
      name: "Instagram Direct",
      icon: "instagram",
      description: "Mensagens diretas do Instagram",
    },
    {
      type: "email",
      name: "Email",
      icon: "mail",
      description: "Atendimento por Email",
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
      tenant_id: channel.tenant_id || "",
      config: channel.config || {},
    });
    setDialogOpen(true);
  };

  const handleNewChannel = () => {
    setSelectedChannel(null);
    setFormData({
      name: "",
      type: "whatsapp",
      tenant_id: "",
      config: {},
    });
    setDialogOpen(true);
  };

  const handleDelete = async (channelId: string) => {
    if (!confirm("Tem certeza que deseja excluir este canal?")) return;

    try {
      const { error } = await supabase
        .from("channels")
        .delete()
        .eq("id", channelId);

      if (error) throw error;

      toast({
        title: "Canal excluído",
        description: "Canal removido com sucesso.",
      });
      loadChannels();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir canal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      let tenantId: string;

      // Se for super_admin, usa o tenant_id selecionado
      if (isSuperAdmin) {
        if (!formData.tenant_id) {
          toast({
            title: "Erro",
            description: "Selecione uma empresa para criar o canal",
            variant: "destructive",
          });
          return;
        }
        tenantId = formData.tenant_id;
      } else {
        // Usuários normais usam seu tenant_id
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
        tenantId = userRole.tenant_id;
      }

      const channelData = {
        name: formData.name,
        type: formData.type === 'baileys-qr' ? 'whatsapp_baileys' : formData.type,
        config: formData.config,
        tenant_id: tenantId,
        status: "active",
      };

      let channelId: string | undefined;

      if (selectedChannel) {
        const { error } = await supabase
          .from("channels")
          .update(channelData)
          .eq("id", selectedChannel.id);

        if (error) throw error;
        channelId = selectedChannel.id;

        toast({
          title: "Canal atualizado",
          description: `Canal ${formData.name} atualizado com sucesso.`,
        });
      } else {
        const { data, error } = await supabase
          .from("channels")
          .insert([channelData])
          .select()
          .single();

        if (error) throw error;
        channelId = data?.id;

        toast({
          title: "Canal criado",
          description: `Canal ${formData.name} criado com sucesso.`,
        });
      }

      // Se for Telegram, registrar webhook automaticamente
      if (formData.type === "telegram" && formData.config.bot_token && channelId) {
        console.log("Registrando webhook do Telegram...");
        
        try {
          const { data: webhookResult, error: webhookError } = await supabase.functions.invoke(
            "telegram-auto-webhook",
            {
              body: {
                botToken: formData.config.bot_token,
              },
            }
          );

          if (webhookError) {
            console.error("Erro ao registrar webhook:", webhookError);
            toast({
              title: "Atenção",
              description: "Canal salvo, mas houve erro ao configurar o webhook. Verifique o token.",
              variant: "destructive",
            });
          } else if (webhookResult?.success) {
            console.log("Webhook registrado com sucesso:", webhookResult);
            toast({
              title: "Sucesso!",
              description: "Canal Telegram configurado e webhook registrado com sucesso!",
            });
          }
        } catch (webhookError) {
          console.error("Erro ao registrar webhook:", webhookError);
        }
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Canais de Atendimento</h2>
          <p className="text-sm text-muted-foreground">
            Configure suas integrações de WhatsApp e outros canais
          </p>
        </div>
        <Button onClick={handleNewChannel}>
          Novo Canal
        </Button>
      </div>

      {/* Baileys Connections Section */}
      {channels.some(channel => channel.type === 'baileys-qr') && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            WhatsApp via QR Code (Baileys)
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {channels
              .filter(channel => channel.type === 'baileys-qr')
              .map((channel) => (
                <div key={channel.id} className="relative group">
                  <BaileysConnection
                    channel={channel}
                    onStatusChange={(status) => {
                      loadChannels();
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(channel.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Evolution API Connections Section */}
      {channels.some(channel => channel.type === 'evolution-api') && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            WhatsApp via Evolution API
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {channels
              .filter(channel => channel.type === 'evolution-api')
              .map((channel) => (
                <div key={channel.id} className="relative group">
                  <EvolutionConnection
                    channel={channel}
                    onStatusChange={(status) => {
                      loadChannels();
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(channel.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Other Channels Section */}
      {channels.filter(channel => channel.type !== 'baileys-qr' && channel.type !== 'evolution-api').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Outros Canais</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {channels
              .filter(channel => channel.type !== 'baileys-qr' && channel.type !== 'evolution-api')
              .map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={{
                    ...channel,
                    connected: channel.status === "active",
                    icon: channel.type,
                    description: availableChannelTypes.find((t) => t.type === channel.type)?.description || "",
                  }}
                  onConfigure={() => handleConfigure(channel)}
                  onDelete={() => handleDelete(channel.id)}
                />
              ))}
          </div>
        </div>
      )}

      <BaileysSetupGuide />

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

              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="tenant_select">Empresa *</Label>
                  <Select
                    value={formData.tenant_id}
                    onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                    disabled={!!selectedChannel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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

              {formData.type === "baileys-qr" && (
                <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Conexão via QR Code</h4>
                      <p className="text-sm text-muted-foreground">
                        Este canal utiliza a biblioteca Baileys para conectar seu WhatsApp 
                        através de QR Code, sem necessidade de API oficial.
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Suporta multi-dispositivo</li>
                        <li>Sem custos de API</li>
                        <li>Conexão direta com WhatsApp</li>
                        <li>Envio e recebimento de mensagens, mídia e áudio</li>
                      </ul>
                      <p className="text-xs text-amber-600 font-medium mt-2">
                        ⚠️ Após salvar, você poderá escanear o QR Code na lista de canais
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
