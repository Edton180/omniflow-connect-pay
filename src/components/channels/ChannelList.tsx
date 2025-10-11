import { useState } from "react";
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

export const ChannelList = () => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);

  const channels = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      type: "whatsapp",
      icon: "message-circle",
      description: "WhatsApp Business API",
      connected: false,
    },
    {
      id: "instagram",
      name: "Instagram",
      type: "instagram",
      icon: "instagram",
      description: "Instagram Direct Messages",
      connected: false,
    },
    {
      id: "facebook",
      name: "Facebook",
      type: "facebook",
      icon: "facebook",
      description: "Facebook Messenger",
      connected: false,
    },
    {
      id: "webchat",
      name: "Web Chat",
      type: "webchat",
      icon: "globe",
      description: "Chat integrado ao seu site",
      connected: false,
    },
  ];

  const handleConfigure = (channel: any) => {
    setSelectedChannel(channel);
    setDialogOpen(true);
  };

  const handleSave = () => {
    toast({
      title: "Configuração salva",
      description: `Canal ${selectedChannel?.name} configurado com sucesso.`,
    });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {channels.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
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
              {selectedChannel?.type === "whatsapp" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número do WhatsApp</Label>
                    <Input
                      id="phone"
                      placeholder="+55 11 99999-9999"
                      type="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                      id="api_key"
                      placeholder="Sua chave de API do WhatsApp Business"
                      type="password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook">Webhook URL</Label>
                    <Input
                      id="webhook"
                      placeholder="https://sua-api.com/webhook"
                      type="url"
                    />
                  </div>
                </>
              )}

              {selectedChannel?.type === "instagram" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_token">Access Token</Label>
                    <Input
                      id="instagram_token"
                      placeholder="Seu token de acesso do Instagram"
                      type="password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="page_id">Page ID</Label>
                    <Input
                      id="page_id"
                      placeholder="ID da sua página do Instagram"
                    />
                  </div>
                </>
              )}

              {selectedChannel?.type === "facebook" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fb_token">Access Token</Label>
                    <Input
                      id="fb_token"
                      placeholder="Seu token de acesso do Facebook"
                      type="password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fb_page_id">Page ID</Label>
                    <Input
                      id="fb_page_id"
                      placeholder="ID da sua página do Facebook"
                    />
                  </div>
                </>
              )}

              {selectedChannel?.type === "webchat" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    O Web Chat está sempre ativo. Copie o código abaixo e cole no seu site:
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <code className="text-xs">
                      {`<script src="https://seu-dominio.com/webchat.js"></script>`}
                    </code>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="greeting">Mensagem de Saudação</Label>
                <Input
                  id="greeting"
                  placeholder="Olá! Como posso ajudar?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto_reply">Resposta Automática</Label>
                <Input
                  id="auto_reply"
                  placeholder="Obrigado por entrar em contato..."
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
