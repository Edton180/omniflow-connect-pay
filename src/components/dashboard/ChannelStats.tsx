import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Mail, Send, Instagram, Facebook, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

export const ChannelStats = () => {
  const { session } = useAuth();
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadChannels();
    }
  }, [session]);

  const loadChannels = async () => {
    try {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", session?.user?.id)
        .single();

      if (!userRole?.tenant_id) return;

      const { data } = await supabase
        .from("channels")
        .select("*")
        .eq("tenant_id", userRole.tenant_id)
        .order("created_at", { ascending: false });

      setChannels(data || []);
    } catch (error) {
      console.error("Error loading channels:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle>Canais Conectados</CardTitle>
          <CardDescription>Status das integrações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (channels.length === 0) {
    return (
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle>Canais Conectados</CardTitle>
          <CardDescription>Status das integrações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum canal conectado ainda</p>
            <p className="text-sm mt-2">Configure seus canais de atendimento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card">
      <CardHeader>
        <CardTitle>Canais Conectados</CardTitle>
        <CardDescription>Status das integrações</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {channels.map((channel) => {
            const Icon = getIcon(channel.type);
            return (
              <div
                key={channel.id}
                className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{channel.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{channel.type}</p>
                  </div>
                </div>
                <Badge variant={channel.status === "active" ? "default" : "secondary"}>
                  {channel.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
