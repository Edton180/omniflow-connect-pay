import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Loader2, Globe, CheckCircle, XCircle, Search, RefreshCw, 
  Power, PowerOff, Filter, MessageSquare, Send, Mail, Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Channel {
  id: string;
  name: string;
  type: string;
  status: string;
  tenant_id: string;
  tenant_name: string;
  created_at: string;
}

const channelTypes = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'email', label: 'Email' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'webchat', label: 'WebChat' },
];

export default function SuperAdminChannels() {
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTenant, setSelectedTenant] = useState("all");

  useEffect(() => {
    fetchTenants();
    fetchAllChannels();
  }, []);

  const fetchTenants = async () => {
    const { data } = await supabase.from("tenants").select("id, name").order("name");
    setTenants(data || []);
  };

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

  const toggleChannelStatus = async (channel: Channel) => {
    try {
      const newStatus = channel.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('channels')
        .update({ status: newStatus })
        .eq('id', channel.id);

      if (error) throw error;
      
      toast({ 
        title: `Canal ${newStatus === 'active' ? 'ativado' : 'desativado'}`,
        description: channel.name 
      });
      fetchAllChannels();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "telegram": return <Send className="h-5 w-5" />;
      case "whatsapp": return <Phone className="h-5 w-5" />;
      case "email": return <Mail className="h-5 w-5" />;
      case "instagram": return <MessageSquare className="h-5 w-5" />;
      case "facebook": return <MessageSquare className="h-5 w-5" />;
      case "webchat": return <Globe className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
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

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.tenant_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || channel.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && (channel.status === 'active' || channel.status === 'connected')) ||
                         (selectedStatus === 'inactive' && channel.status !== 'active' && channel.status !== 'connected');
    const matchesTenant = selectedTenant === 'all' || channel.tenant_id === selectedTenant;
    return matchesSearch && matchesType && matchesStatus && matchesTenant;
  });

  // Stats
  const totalChannels = channels.length;
  const activeChannels = channels.filter(c => c.status === 'active' || c.status === 'connected').length;
  const channelsByType = channelTypes.slice(1).map(type => ({
    type: type.label,
    count: channels.filter(c => c.type === type.value).length
  }));

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Todos os Canais do Sistema</h1>
              <p className="text-sm text-muted-foreground">
                {activeChannels} ativos de {totalChannels} canais
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchAllChannels}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalChannels}</div>
              <p className="text-sm text-muted-foreground">Total de Canais</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">{activeChannels}</div>
              <p className="text-sm text-muted-foreground">Canais Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{tenants.length}</div>
              <p className="text-sm text-muted-foreground">Empresas com Canais</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{channelsByType.find(c => c.count > 0)?.type || '-'}</div>
              <p className="text-sm text-muted-foreground">Tipo Mais Usado</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou empresa..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {channelTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {tenants.map(tenant => (
                <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Channels Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredChannels.map((channel) => (
            <Card key={channel.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-primary/10">
                      {getChannelIcon(channel.type)}
                    </span>
                    {channel.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleChannelStatus(channel)}
                    title={channel.status === 'active' ? 'Desativar' : 'Ativar'}
                  >
                    {channel.status === 'active' ? (
                      <Power className="h-4 w-4 text-green-500" />
                    ) : (
                      <PowerOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(channel.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <Badge variant="outline" className="capitalize">{channel.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Empresa:</span>
                    <span className="text-sm font-medium truncate max-w-[120px]">{channel.tenant_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Criado em {new Date(channel.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredChannels.length === 0 && (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum canal encontrado com os filtros selecionados</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
