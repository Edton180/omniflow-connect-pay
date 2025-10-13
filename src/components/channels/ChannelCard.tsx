import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Instagram, Facebook, Globe, Settings, CheckCircle, XCircle, Mail, Send, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChannelCardProps {
  channel: {
    id: string;
    name: string;
    type: string;
    icon: string;
    description: string;
    connected: boolean;
    status?: string;
  };
  onConfigure: () => void;
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

export const ChannelCard = ({ channel, onConfigure, onDelete }: ChannelCardProps) => {
  const Icon = getIcon(channel.type);
  const colorClass = getColor(channel.type);
  const { toast } = useToast();

  const getWebhookUrl = () => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (channel.type === 'telegram') {
      return `${baseUrl}/functions/v1/telegram-webhook`;
    }
    if (channel.type === 'whatsapp') {
      return `${baseUrl}/functions/v1/whatsapp-webhook`;
    }
    return null;
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

        <div className="flex gap-2">
          <Button
            variant={channel.connected ? "outline" : "default"}
            className="flex-1"
            onClick={onConfigure}
          >
            <Settings className="mr-2 h-4 w-4" />
            {channel.connected ? "Configurar" : "Conectar"}
          </Button>
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
