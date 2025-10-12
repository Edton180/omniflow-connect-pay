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
    <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/95">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Atendimento por fila</CardTitle>
        <CardDescription>Status das filas de atendimento</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {channels.map((channel) => {
            const Icon = getIcon(channel.type);
            return (
              <div
                key={channel.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-card to-card/50 border border-border/50 rounded-xl hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-base">{channel.name}</p>
                    <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${channel.status === 'active' ? 'bg-green-500' : 'bg-muted'}`}></span>
                      {channel.type}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={channel.status === "active" ? "default" : "secondary"}
                  className="px-3 py-1"
                >
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
