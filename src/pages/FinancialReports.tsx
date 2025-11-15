import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, DollarSign, CreditCard, AlertCircle, Download } from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FinancialReports() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6");
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [gatewayData, setGatewayData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    successRate: 0,
    avgTicket: 0,
    overdueCount: 0,
  });

  useEffect(() => {
    loadReports();
  }, [period]);

  const loadReports = async () => {
    try {
      setLoading(true);

      const monthsAgo = parseInt(period);
      const startDate = startOfMonth(subMonths(new Date(), monthsAgo - 1));

      // Buscar pagamentos
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .eq("status", "completed");

      if (paymentsError) throw paymentsError;

      // Buscar faturas
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (invoicesError) throw invoicesError;

      // Processar dados de receita por mês
      const revenueByMonth: Record<string, number> = {};
      payments?.forEach((payment) => {
        const month = format(new Date(payment.created_at), "MMM/yy", { locale: ptBR });
        revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(payment.amount);
      });

      const revenueChartData = Object.entries(revenueByMonth).map(([month, revenue]) => ({
        month,
        receita: revenue,
      }));

      setRevenueData(revenueChartData);

      // Processar dados por gateway
      const gatewayStats: Record<string, { count: number; revenue: number }> = {};
      payments?.forEach((payment) => {
        const gateway = payment.payment_gateway || "Outro";
        if (!gatewayStats[gateway]) {
          gatewayStats[gateway] = { count: 0, revenue: 0 };
        }
        gatewayStats[gateway].count++;
        gatewayStats[gateway].revenue += Number(payment.amount);
      });

      const gatewayChartData = Object.entries(gatewayStats).map(([name, data]) => ({
        name: name.toUpperCase(),
        value: data.count,
        revenue: data.revenue,
      }));

      setGatewayData(gatewayChartData);

      // Calcular estatísticas
      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const successRate = invoices && invoices.length > 0
        ? (invoices.filter((i) => i.status === "paid").length / invoices.length) * 100
        : 0;
      const avgTicket = payments && payments.length > 0
        ? totalRevenue / payments.length
        : 0;
      const overdueCount = invoices?.filter((i) => i.status === "overdue").length || 0;

      setStats({
        totalRevenue,
        successRate,
        avgTicket,
        overdueCount,
      });

    } catch (error: any) {
      console.error("Error loading reports:", error);
      toast.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.info("Exportando dados...");
      
      // Gerar CSV com dados
      const headers = ["Mês", "Receita"];
      const rows = revenueData.map((d) => [d.month, d.receita]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      
      // Download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-financeiro-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Relatório exportado com sucesso!");
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar relatório");
    }
  };

  const COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">
            Análise completa de receita e performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stats.totalRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos {period} meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Sucesso
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {stats.successRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pagamentos aprovados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(stats.avgTicket)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Valor médio por transação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inadimplência
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {stats.overdueCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Faturas vencidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Receita por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => 
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(value)
                }
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="receita" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                name="Receita"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gateway Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Gateway</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gatewayData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gatewayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita por Gateway</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gatewayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value)
                  }
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8B5CF6" name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
