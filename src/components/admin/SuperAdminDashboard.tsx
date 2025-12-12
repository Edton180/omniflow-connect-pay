import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Users, Ticket, MessageSquare, CreditCard, TrendingUp, 
  DollarSign, FileText, BarChart3, Key, Globe, Palette, Layers, Bot,
  Activity, Zap, CheckCircle, XCircle, RefreshCw, Send, Cpu
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { ServerInfoPanel } from "./ServerInfoPanel";
import { useToast } from "@/hooks/use-toast";

export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalUsers: 1,
    activeTickets: 0,
    todayMessages: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    totalChannels: 0,
    activeChannels: 0,
    weekMessages: 0,
    resolvedTickets: 0,
  });

  const [healthStatus, setHealthStatus] = useState({
    database: 'checking' as 'ok' | 'error' | 'checking',
    edgeFunctions: 'checking' as 'ok' | 'error' | 'checking',
    storage: 'checking' as 'ok' | 'error' | 'checking',
  });

  useEffect(() => {
    fetchStats();
    checkHealth();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all stats in parallel
      const [
        tenantsResult,
        usersResult,
        ticketsResult,
        messagesResult,
        paymentsResult,
        invoicesResult,
        channelsResult,
        weekMessagesResult,
        resolvedResult,
      ] = await Promise.all([
        supabase.from('tenants').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('messages').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
        supabase.from('payments').select('amount').eq('status', 'completed'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('channels').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
      ]);

      const activeChannelsResult = await supabase
        .from('channels')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const totalRevenue = paymentsResult.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        totalTenants: tenantsResult.count || 0,
        totalUsers: usersResult.count || 0,
        activeTickets: ticketsResult.count || 0,
        todayMessages: messagesResult.count || 0,
        totalRevenue,
        pendingInvoices: invoicesResult.count || 0,
        totalChannels: channelsResult.count || 0,
        activeChannels: activeChannelsResult.count || 0,
        weekMessages: weekMessagesResult.count || 0,
        resolvedTickets: resolvedResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    // Check Database
    try {
      const { error } = await supabase.from('tenants').select('id').limit(1);
      setHealthStatus(prev => ({ ...prev, database: error ? 'error' : 'ok' }));
    } catch {
      setHealthStatus(prev => ({ ...prev, database: 'error' }));
    }

    // Check Edge Functions
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-gateway`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ test: true })
      });
      setHealthStatus(prev => ({ ...prev, edgeFunctions: response.ok ? 'ok' : 'error' }));
    } catch {
      setHealthStatus(prev => ({ ...prev, edgeFunctions: 'error' }));
    }

    // Check Storage
    try {
      const { error } = await supabase.storage.listBuckets();
      setHealthStatus(prev => ({ ...prev, storage: error ? 'error' : 'ok' }));
    } catch {
      setHealthStatus(prev => ({ ...prev, storage: 'error' }));
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchStats();
    await checkHealth();
    setRefreshing(false);
    toast({ title: "Dados atualizados" });
  };

  const getHealthIcon = (status: 'ok' | 'error' | 'checking') => {
    if (status === 'checking') return <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (status === 'ok') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Super Admin Dashboard</h2>
            <p className="text-muted-foreground">Gerenciar todos os tenants e configurações do sistema</p>
          </div>
          <Button onClick={refreshData} disabled={refreshing} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Quick Health Status */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border">
            {getHealthIcon(healthStatus.database)}
            <span className="text-sm">Banco de Dados</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border">
            {getHealthIcon(healthStatus.edgeFunctions)}
            <span className="text-sm">Edge Functions</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border">
            {getHealthIcon(healthStatus.storage)}
            <span className="text-sm">Storage</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
            <Zap className="h-4 w-4 text-purple-500" />
            Lovable AI Ativo
          </Badge>
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="gradient-card hover-scale cursor-pointer" onClick={() => navigate('/admin/tenants')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tenants</CardTitle>
              <Building2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTenants}</div>
              <p className="text-xs text-muted-foreground mt-1">Empresas cadastradas</p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale cursor-pointer" onClick={() => navigate('/admin/users')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Usuários no sistema</p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale cursor-pointer" onClick={() => navigate('/admin/all-channels')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canais</CardTitle>
              <Globe className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeChannels}/{stats.totalChannels}</div>
              <p className="text-xs text-muted-foreground mt-1">Ativos / Total</p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale cursor-pointer" onClick={() => navigate('/admin/all-tickets')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Ativos</CardTitle>
              <Ticket className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeTickets}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.resolvedTickets} resolvidos</p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
              <MessageSquare className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.todayMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.weekMessages} esta semana</p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale cursor-pointer" onClick={() => navigate('/admin/revenue')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pagamentos concluídos</p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale cursor-pointer" onClick={() => navigate('/admin/invoices')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturas Pendentes</CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando pagamento</p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale cursor-pointer" onClick={() => navigate('/admin/ai-config')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IA Global</CardTitle>
              <Cpu className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Lovable AI</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Configurar modelos</p>
            </CardContent>
          </Card>
        </div>

        {/* Server Info Panel */}
        <div className="mb-8">
          <ServerInfoPanel />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/admin/tenants')}>
                <Building2 className="mr-3 h-5 w-5" />
                Gerenciar Tenants
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/admin/users')}>
                <Users className="mr-3 h-5 w-5" />
                Gerenciar Usuários
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/admin/all-tickets')}>
                <MessageSquare className="mr-3 h-5 w-5" />
                Todos os Atendimentos
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/admin/all-channels')}>
                <Globe className="mr-3 h-5 w-5" />
                Todos os Canais
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/admin/invoices')}>
                <FileText className="mr-3 h-5 w-5" />
                Gerenciar Faturas
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/payments')}>
                <CreditCard className="mr-3 h-5 w-5" />
                Planos e Pagamentos
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/admin/revenue')}>
                <BarChart3 className="mr-3 h-5 w-5" />
                Receita e Faturamento
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/financial-reports')}>
                <TrendingUp className="mr-3 h-5 w-5" />
                Relatórios Financeiros
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/admin/ai-config')}>
                <Bot className="mr-3 h-5 w-5 text-purple-500" />
                Configuração IA Global
                <Badge className="ml-auto bg-purple-500">Novo</Badge>
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/admin/settings')}>
                <Key className="mr-3 h-5 w-5" />
                Secrets de Pagamento
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/chatbot-settings')}>
                <Bot className="mr-3 h-5 w-5" />
                Configurar Chatbot IA
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/audit-logs')}>
                <Activity className="mr-3 h-5 w-5" />
                Logs de Auditoria
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personalização</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/landing-page-editor')}>
                <Globe className="mr-3 h-5 w-5" />
                Editar Landing Page
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/branding')}>
                <Palette className="mr-3 h-5 w-5" />
                Personalizar Marca
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/admin/themes')}>
                <Layers className="mr-3 h-5 w-5" />
                Gerenciar Temas
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/webhooks')}>
                <Zap className="mr-3 h-5 w-5" />
                Dashboard Webhooks
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/webhook-config')}>
                <Send className="mr-3 h-5 w-5" />
                Config. Gateways
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/webchat-setup')}>
                <MessageSquare className="mr-3 h-5 w-5" />
                WebChat Setup
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/agent-reports')}>
                <Activity className="mr-3 h-5 w-5" />
                Relatórios de Agentes
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/advanced-analytics')}>
                <BarChart3 className="mr-3 h-5 w-5" />
                Analytics Avançado
              </Button>
              <Button className="h-14 text-base justify-start" variant="outline" onClick={() => navigate('/admin/all-crm')}>
                <Users className="mr-3 h-5 w-5" />
                Todos os Leads CRM
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};