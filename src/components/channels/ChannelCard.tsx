import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Instagram, Facebook, Globe, Settings, CheckCircle, XCircle, Mail, Send, Trash2, Copy, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

interface ChannelCardProps {
  channel: {
    id: string;
    name: string;
    type: string;
    icon: string;
    description: string;
    connected: boolean;
    status?: string;
    tenant_id: string;
  };
  onDelete?: () => void;
}

const getIcon = (type: string) => {
  const icons: Record<string, any> = {
    whatsapp: MessageCircle,
    email: Mail,
    telegram: Send,
    instagram: Instagram,
    facebook: Facebook,
    webchat: Globe,
  };
  return icons[type] || MessageCircle;
};

const getColor = (type: string) => {
  const colors: Record<string, string> = {
    whatsapp: "bg-green-500",
    email: "bg-red-500",
    telegram: "bg-blue-400",
    instagram: "bg-pink-500",
    facebook: "bg-blue-600",
    webchat: "bg-purple-500",
  };
  return colors[type] || "bg-gray-500";
};

export const ChannelCard = ({ channel, onDelete }: ChannelCardProps) => {
  const Icon = getIcon(channel.type);
  const colorClass = getColor(channel.type);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [queues, setQueues] = useState<any[]>([]);
  const [channelQueues, setChannelQueues] = useState<string[]>([]);
  const [showQueueSelect, setShowQueueSelect] = useState(false);

  useEffect(() => {
    loadQueues();
    loadChannelQueues();
  }, [channel.id]);

  const loadQueues = async () => {
    const { data } = await supabase
      .from("queues")
      .select("*")
      .eq("tenant_id", channel.tenant_id)
      .eq("is_active", true);
    setQueues(data || []);
  };

  const loadChannelQueues = async () => {
    const { data } = await supabase
      .from("channel_queues")
      .select("queue_id")
      .eq("channel_id", channel.id);
    setChannelQueues(data?.map(cq => cq.queue_id) || []);
  };

  const handleAddQueue = async (queueId: string) => {
    try {
      const { error } = await supabase
        .from("channel_queues")
        .insert({ channel_id: channel.id, queue_id: queueId });

      if (error) throw error;

      toast({
        title: "Fila adicionada",
        description: "Fila vinculada ao canal com sucesso",
      });
      
      loadChannelQueues();
      setShowQueueSelect(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveQueue = async (queueId: string) => {
    try {
      const { error } = await supabase
        .from("channel_queues")
        .delete()
        .eq("channel_id", channel.id)
        .eq("queue_id", queueId);

      if (error) throw error;

      toast({
        title: "Fila removida",
        description: "Fila desvinculada do canal",
      });
      
      loadChannelQueues();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getWebhookUrl = () => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const webhookMap: Record<string, string> = {
      'telegram': `${baseUrl}/functions/v1/telegram-webhook`,
      'whatsapp': `${baseUrl}/functions/v1/waba-webhook`,
      'facebook': `${baseUrl}/functions/v1/facebook-webhook`,
      'instagram': `${baseUrl}/functions/v1/facebook-webhook`,
    };
    return webhookMap[channel.type] || null;
  };

  const webhookUrl = getWebhookUrl();

  const copyWebhook = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      toast({ title: "Webhook copiado!", description: "URL copiada para a área de transferência" });
    }
  };

  return (
    <Card className="gradient-card hover-scale">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-lg ${colorClass} flex items-center justify-center text-white`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{channel.name}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {channel.description}
              </CardDescription>
            </div>
          </div>
          {channel.connected ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={channel.connected ? "default" : "secondary"}>
            {channel.connected ? "Conectado" : "Desconectado"}
          </Badge>
        </div>
        
        {webhookUrl && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={webhookUrl}
                className="text-xs font-mono"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={copyWebhook}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Filas Vinculadas</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQueueSelect(!showQueueSelect)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {showQueueSelect && (
            <Select onValueChange={handleAddQueue}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Adicionar fila" />
              </SelectTrigger>
              <SelectContent>
                {queues
                  .filter(q => !channelQueues.includes(q.id))
                  .map((queue) => (
                    <SelectItem key={queue.id} value={queue.id}>
                      {queue.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex flex-wrap gap-1">
            {queues
              .filter(q => channelQueues.includes(q.id))
              .map((queue) => (
                <Badge
                  key={queue.id}
                  variant="secondary"
                  className="text-xs cursor-pointer"
                  onClick={() => handleRemoveQueue(queue.id)}
                >
                  {queue.name} ×
                </Badge>
              ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate(`/channels/${channel.id}/config`)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
          {channel.type === "webchat" && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/webchat-setup")}
            >
              <Globe className="mr-2 h-4 w-4" />
              Configurar Widget
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
