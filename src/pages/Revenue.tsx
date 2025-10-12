import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  AlertCircle,
  Calendar,
  CheckCircle
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const Revenue = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [invoicesByStatus, setInvoicesByStatus] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);

      // Fetch all payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*, tenants(name)')
        .eq('status', 'completed')
        .order('paid_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch all invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*, tenants(name)')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Calculate stats
      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const paidInvoices = invoices?.filter(i => i.status === 'paid').length || 0;
      const pendingInvoices = invoices?.filter(i => i.status === 'pending').length || 0;
      const overdueInvoices = invoices?.filter(i => i.status === 'overdue').length || 0;

      // Monthly revenue
      const currentMonth = new Date();
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const monthlyRevenue = payments?.filter(p => {
        const paidDate = new Date(p.paid_at);
        return paidDate >= monthStart && paidDate <= monthEnd;
      }).reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Previous month revenue for growth calculation
      const prevMonth = new Date(currentMonth.setMonth(currentMonth.getMonth() - 1));
      const prevMonthStart = startOfMonth(prevMonth);
      const prevMonthEnd = endOfMonth(prevMonth);
      
      const prevMonthRevenue = payments?.filter(p => {
        const paidDate = new Date(p.paid_at);
        return paidDate >= prevMonthStart && paidDate <= prevMonthEnd;
      }).reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const revenueGrowth = prevMonthRevenue > 0 
        ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
        : 0;

      setStats({
        totalRevenue,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        monthlyRevenue,
        revenueGrowth
      });

      // Prepare chart data - last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dayPayments = payments?.filter(p => {
          const paidDate = new Date(p.paid_at);
          return format(paidDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        }) || [];
        
        return {
          date: format(date, 'dd/MM', { locale: ptBR }),
          receita: dayPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          quantidade: dayPayments.length
        };
      });

      setRevenueData(last7Days);

      // Invoices by status for pie chart
      const statusData = [
        { name: 'Pagas', value: paidInvoices, color: '#10b981' },
        { name: 'Pendentes', value: pendingInvoices, color: '#f59e0b' },
        { name: 'Vencidas', value: overdueInvoices, color: '#ef4444' }
      ];

      setInvoicesByStatus(statusData);

      // Recent payments
      setRecentPayments(payments?.slice(0, 5) || []);

    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados de receita...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gradient">Receita e Faturamento</h1>
            <p className="text-muted-foreground">Acompanhe pagamentos e receitas em tempo real</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Acumulado de todos os pagamentos
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturas Pendentes</CardTitle>
              <AlertCircle className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando pagamento
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturas Vencidas</CardTitle>
              <CreditCard className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdueInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requerem atenção
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="charts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos Recentes</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Revenue Line Chart */}
              <Card className="gradient-card">
                <CardHeader>
                  <CardTitle>Receita - Últimos 7 Dias</CardTitle>
                  <CardDescription>Evolução diária do faturamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="receita" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="Receita"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Invoice Status Pie Chart */}
              <Card className="gradient-card">
                <CardHeader>
                  <CardTitle>Status das Faturas</CardTitle>
                  <CardDescription>Distribuição por status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={invoicesByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {invoicesByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Payment Volume Bar Chart */}
              <Card className="gradient-card md:col-span-2">
                <CardHeader>
                  <CardTitle>Volume de Pagamentos</CardTitle>
                  <CardDescription>Quantidade de pagamentos por dia</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip labelStyle={{ color: '#000' }} />
                      <Legend />
                      <Bar 
                        dataKey="quantidade" 
                        fill="#3b82f6" 
                        name="Quantidade de Pagamentos"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle>Pagamentos Recentes</CardTitle>
                <CardDescription>Últimas transações processadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPayments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum pagamento registrado ainda
                    </div>
                  ) : (
                    recentPayments.map((payment) => (
                      <div 
                        key={payment.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">{payment.tenants?.name || 'Tenant'}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.payment_gateway} • {format(new Date(payment.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(Number(payment.amount))}</p>
                          <Badge variant="outline" className="mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {payment.payment_method || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Revenue;
