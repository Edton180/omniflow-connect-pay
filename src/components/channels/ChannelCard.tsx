import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Instagram, Facebook, Globe, Settings, CheckCircle, XCircle } from "lucide-react";

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
}

const getIcon = (type: string) => {
  const icons: Record<string, any> = {
    whatsapp: MessageCircle,
    instagram: Instagram,
    facebook: Facebook,
    webchat: Globe,
  };
  return icons[type] || MessageCircle;
};

const getColor = (type: string) => {
  const colors: Record<string, string> = {
    whatsapp: "bg-green-500",
    instagram: "bg-pink-500",
    facebook: "bg-blue-500",
    webchat: "bg-purple-500",
  };
  return colors[type] || "bg-gray-500";
};

export const ChannelCard = ({ channel, onConfigure }: ChannelCardProps) => {
  const Icon = getIcon(channel.type);
  const colorClass = getColor(channel.type);

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
        <Button
          variant={channel.connected ? "outline" : "default"}
          className="w-full"
          onClick={onConfigure}
        >
          <Settings className="mr-2 h-4 w-4" />
          {channel.connected ? "Configurar" : "Conectar"}
        </Button>
      </CardContent>
    </Card>
  );
};
