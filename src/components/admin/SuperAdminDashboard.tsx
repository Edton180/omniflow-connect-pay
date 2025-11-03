import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Ticket, MessageSquare, CreditCard, TrendingUp, DollarSign, FileText, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";

export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalUsers: 1,
    activeTickets: 0,
    todayMessages: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch tenants count
      const { count: tenantsCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true });

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active tickets count
      const { count: ticketsCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      // Fetch today's messages count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Fetch total revenue
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed');

      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Fetch pending invoices count
      const { count: pendingInvoicesCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        totalTenants: tenantsCount || 0,
        totalUsers: usersCount || 0,
        activeTickets: ticketsCount || 0,
        todayMessages: messagesCount || 0,
        totalRevenue,
        pendingInvoices: pendingInvoicesCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Super Admin Dashboard</h2>
          <p className="text-muted-foreground">Gerenciar todos os tenants e configurações do sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tenants</CardTitle>
              <Building2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTenants}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalTenants === 0 ? 'Nenhum tenant ainda' : `${stats.totalTenants} empresa${stats.totalTenants > 1 ? 's' : ''}`}
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalUsers === 1 ? 'Você' : `${stats.totalUsers} usuários`}
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Ativos</CardTitle>
              <Ticket className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeTickets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeTickets === 0 ? 'Nenhum ticket ativo' : `${stats.activeTickets} aberto${stats.activeTickets > 1 ? 's' : ''}`}
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
              <MessageSquare className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.todayMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.todayMessages === 0 ? 'Nenhuma mensagem hoje' : `${stats.todayMessages} mensagem${stats.todayMessages > 1 ? 'ns' : ''}`}
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pagamentos concluídos
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturas Pendentes</CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando pagamento
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button 
              className="h-20 text-lg" 
              variant="outline"
              onClick={() => navigate('/admin/tenants')}
            >
              <Building2 className="mr-2 h-5 w-5" />
              Gerenciar Tenants
            </Button>
            <Button 
              className="h-20 text-lg" 
              variant="outline"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="mr-2 h-5 w-5" />
              Gerenciar Usuários
            </Button>
            <Button 
              className="h-20 text-lg" 
              variant="outline"
              onClick={() => navigate('/admin/all-tickets')}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Todos os Atendimentos
            </Button>
            <Button 
              className="h-20 text-lg" 
              variant="outline"
              onClick={() => navigate('/admin/invoices')}
            >
              <FileText className="mr-2 h-5 w-5" />
              Gerenciar Faturas
            </Button>
            <Button 
              className="h-20 text-lg" 
              variant="outline"
              onClick={() => navigate('/payments')}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Planos e Pagamentos
            </Button>
            <Button 
              className="h-20 text-lg" 
              variant="outline"
              onClick={() => navigate('/admin/revenue')}
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              Receita e Faturamento
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};