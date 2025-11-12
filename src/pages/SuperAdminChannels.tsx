import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2, Globe, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Channel {
  id: string;
  name: string;
  type: string;
  status: string;
  tenant_id: string;
  tenant_name: string;
  created_at: string;
}

export default function SuperAdminChannels() {
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllChannels();
  }, []);

  const fetchAllChannels = async () => {
    setLoading(true);
    try {
      const { data: channelsData, error } = await supabase
        .from("channels")
        .select(`
          id,
          name,
          type,
          status,
          tenant_id,
          created_at,
          tenants!inner(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedChannels = channelsData?.map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        status: channel.status,
        tenant_id: channel.tenant_id,
        tenant_name: channel.tenants.name,
        created_at: channel.created_at,
      })) || [];

      setChannels(formattedChannels);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar canais",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "telegram": return "📱";
      case "whatsapp": return "💬";
      case "email": return "📧";
      case "instagram": return "📷";
      case "facebook": return "👥";
      default: return "🌐";
    }
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === "active" || status === "connected";
    return (
      <Badge variant={isActive ? "default" : "secondary"} className="flex items-center gap-1">
        {isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {isActive ? "Ativo" : "Inativo"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Todos os Canais do Sistema</h2>
          <p className="text-muted-foreground">Visualize todos os canais de atendimento de todas as empresas</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <Card key={channel.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-2xl">{getChannelIcon(channel.type)}</span>
                  {channel.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(channel.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <Badge variant="outline">{channel.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Empresa:</span>
                    <span className="text-sm font-medium">{channel.tenant_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Criado em {new Date(channel.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {channels.length === 0 && (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum canal encontrado no sistema</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
