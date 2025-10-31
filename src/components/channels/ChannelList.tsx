import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelCard } from "./ChannelCard";
import { QrCode, Trash2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ChannelList = () => {
  const { toast } = useToast();
  const { session, isSuperAdmin } = useAuth();
  const [channels, setChannels] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    config: {} as any,
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
      type: "whatsapp",
      name: "WhatsApp Business API (WABA)",
      icon: "message-circle",
      description: "WhatsApp Business API Oficial da Meta",
    },
    {
      type: "telegram",
      name: "Telegram Bot",
      icon: "send",
      description: "Telegram Bot com token manual",
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

  const handleNewChannel = () => {
    setFormData({ name: "", type: "", config: {} });
    setDialogOpen(true);
  };

  const handleSaveChannel = async () => {
    try {
      if (!formData.name || !formData.type) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha o nome e tipo do canal",
          variant: "destructive",
        });
        return;
      }

      // Buscar tenant_id do usuário
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", session?.user?.id)
        .single();

      if (!userRole?.tenant_id) {
        toast({
          title: "Erro",
          description: "Usuário não possui tenant associado",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("channels").insert({
        tenant_id: userRole.tenant_id,
        name: formData.name,
        type: formData.type,
        status: "pending",
        config: formData.config,
      });

      if (error) throw error;

      toast({
        title: "Canal criado",
        description: "Canal criado com sucesso. Configure-o nas configurações avançadas.",
      });

      setDialogOpen(false);
      loadChannels();
    } catch (error: any) {
      toast({
        title: "Erro ao criar canal",
        description: error.message,
        variant: "destructive",
      });
    }
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

      {/* Other Channels Section */}
      {channels.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Canais Configurados</h3>
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
                  onDelete={() => handleDelete(channel.id)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Dialog para criar novo canal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Canal</DialogTitle>
            <DialogDescription>
              Configure um novo canal de atendimento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Canal</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Atendimento Principal"
              />
            </div>
            <div>
              <Label>Tipo de Canal</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="telegram">Telegram Bot</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp Business API</SelectItem>
                  <SelectItem value="webchat">Web Chat</SelectItem>
                  <SelectItem value="facebook">Facebook Messenger</SelectItem>
                  <SelectItem value="instagram">Instagram Direct</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === "telegram" && (
              <div>
                <Label>Token do Bot</Label>
                <Input
                  value={formData.config.bot_token || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      config: { ...formData.config, bot_token: e.target.value },
                    })
                  }
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                />
              </div>
            )}

            {formData.type === "whatsapp" && (
              <>
                <div>
                  <Label>Phone Number ID</Label>
                  <Input
                    value={formData.config.phone_number_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: { ...formData.config, phone_number_id: e.target.value },
                      })
                    }
                    placeholder="ID do número de telefone"
                  />
                </div>
                <div>
                  <Label>Access Token</Label>
                  <Input
                    value={formData.config.access_token || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: { ...formData.config, access_token: e.target.value },
                      })
                    }
                    placeholder="Token de acesso da API"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveChannel}>Criar Canal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
