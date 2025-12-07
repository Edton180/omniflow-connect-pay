import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Clock, CheckCircle2, Star, TrendingUp, Users, AlertCircle, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444'];

type PeriodFilter = "7days" | "30days" | "90days" | "all";

export default function AgentReports() {
  const [period, setPeriod] = useState<PeriodFilter>("30days");
  const { profile, isSuperAdmin } = useAuth();

  const getPeriodDays = (p: PeriodFilter) => {
    switch (p) {
      case "7days": return 7;
      case "30days": return 30;
      case "90days": return 90;
      default: return 365;
    }
  };

  const { data: agentPerformance, isLoading } = useQuery({
    queryKey: ["agent-performance", period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_agent_performance");
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar tickets por status para gráfico
  const { data: ticketStats } = useQuery({
    queryKey: ["ticket-stats", period, profile?.tenant_id],
    queryFn: async () => {
      const days = getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from("tickets")
        .select("status, assigned_to, created_at");
      
      if (profile?.tenant_id) {
        query = query.eq("tenant_id", profile.tenant_id);
      }

      query = query.gte("created_at", startDate.toISOString());

      const { data, error } = await query;
      if (error) throw error;

      // Agrupar por status
      const byStatus = (data || []).reduce((acc: any, ticket: any) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      }, {});

      return {
        total: data?.length || 0,
        byStatus: Object.entries(byStatus).map(([name, value]) => ({
          name: name === 'open' ? 'Abertos' : name === 'closed' ? 'Fechados' : name === 'pending' ? 'Pendentes' : name,
          value,
        })),
        assigned: data?.filter(t => t.assigned_to).length || 0,
        unassigned: data?.filter(t => !t.assigned_to).length || 0,
      };
    },
  });

  const formatMinutes = (minutes: number | null) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getPerformanceLevel = (agent: any) => {
    if (!agent.total_tickets) return { level: "Iniciante", color: "secondary" };
    if (agent.avg_satisfaction >= 4.5 && agent.closed_tickets > 10) return { level: "Excelente", color: "default" };
    if (agent.avg_satisfaction >= 4) return { level: "Bom", color: "outline" };
    if (agent.avg_satisfaction >= 3) return { level: "Regular", color: "secondary" };
    return { level: "Precisa Melhorar", color: "destructive" };
  };

  // Calcular estatísticas gerais
  const totalTickets = agentPerformance?.reduce((sum: number, a: any) => sum + (a.total_tickets || 0), 0) || 0;
  const totalClosed = agentPerformance?.reduce((sum: number, a: any) => sum + (a.closed_tickets || 0), 0) || 0;
  const avgSatisfaction = agentPerformance?.length 
    ? agentPerformance.reduce((sum: number, a: any) => sum + (a.avg_satisfaction || 0), 0) / agentPerformance.length 
    : 0;

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Relatórios de Agentes
            </h1>
            <p className="text-muted-foreground mt-1">
              Desempenho individual dos agentes e métricas de atendimento
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Explicação */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Como funcionam os relatórios de agentes?</p>
                <p className="text-muted-foreground mt-1">
                  Os dados são coletados automaticamente a partir dos tickets atribuídos a cada agente. 
                  O tempo médio de resolução é calculado desde a abertura até o fechamento do ticket. 
                  A satisfação é baseada nas avaliações dos clientes após o atendimento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas Gerais */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Tickets</p>
                  <p className="text-2xl font-bold">{ticketStats?.total || totalTickets}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tickets Fechados</p>
                  <p className="text-2xl font-bold">{totalClosed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Agentes Ativos</p>
                  <p className="text-2xl font-bold">{agentPerformance?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Satisfação Média</p>
                  <p className="text-2xl font-bold">{avgSatisfaction.toFixed(1)}/5</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico de Tickets por Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Status</CardTitle>
              <CardDescription>Tickets agrupados por status atual</CardDescription>
            </CardHeader>
            <CardContent>
              {ticketStats?.byStatus && ticketStats.byStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={ticketStats.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ticketStats.byStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Performance por Agente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tickets por Agente</CardTitle>
              <CardDescription>Total de tickets atendidos por cada agente</CardDescription>
            </CardHeader>
            <CardContent>
              {agentPerformance && agentPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={agentPerformance.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="full_name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_tickets" fill="hsl(var(--primary))" name="Total" />
                    <Bar dataKey="closed_tickets" fill="hsl(var(--secondary))" name="Fechados" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Agentes */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Desempenho Individual</h2>
          
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-3 bg-muted rounded w-full mb-2" />
                </Card>
              ))}
            </div>
          ) : agentPerformance && agentPerformance.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agentPerformance.map((agent: any) => {
                const performance = getPerformanceLevel(agent);
                const closureRate = agent.total_tickets 
                  ? Math.round((agent.closed_tickets / agent.total_tickets) * 100) 
                  : 0;

                return (
                  <Card key={agent.agent_id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.agent_id}`} />
                          <AvatarFallback>
                            {agent.full_name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{agent.full_name}</h3>
                          <Badge variant={performance.color as any}>{performance.level}</Badge>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Taxa de fechamento */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Taxa de Fechamento</span>
                            <span className="font-medium">{closureRate}%</span>
                          </div>
                          <Progress value={closureRate} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-semibold">{agent.total_tickets || 0}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Fechados:</span>
                            <span className="font-semibold">{agent.closed_tickets || 0}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Tempo:</span>
                            <span className="font-semibold">
                              {formatMinutes(agent.avg_resolution_min)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Nota:</span>
                            <span className="font-semibold">
                              {agent.avg_satisfaction
                                ? `${agent.avg_satisfaction.toFixed(1)}/5`
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum dado disponível</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Os relatórios são gerados automaticamente quando os agentes começam a atender tickets. 
                Atribua tickets aos agentes e feche-os para gerar estatísticas de desempenho.
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
