import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import { Clock, Star, Users, TrendingUp, MessageSquare, CheckCircle, Timer, Zap } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Ticket {
  id: string;
  status: string;
  channel: string;
  created_at: string;
  closed_at: string | null;
  assigned_to: string | null;
  evaluation_score: number | null;
}

interface Message {
  id: string;
  ticket_id: string;
  is_from_contact: boolean;
  created_at: string;
  sender_id: string | null;
}

interface Agent {
  id: string;
  full_name: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#10B981', '#F59E0B', '#EF4444'];

export default function AdvancedAnalytics() {
  const { roles } = useAuth();
  const [dateRange, setDateRange] = useState("7");
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  
  const tenantId = roles.find(r => r.tenant_id)?.tenant_id;

  useEffect(() => {
    if (tenantId) loadData();
  }, [tenantId, dateRange]);

  const loadData = async () => {
    if (!tenantId) return;
    setLoading(true);
    
    const startDate = subDays(new Date(), parseInt(dateRange));
    
    const [ticketsRes, messagesRes, agentsRes] = await Promise.all([
      supabase
        .from("tickets")
        .select("id, status, channel, created_at, closed_at, assigned_to, evaluation_score")
        .eq("tenant_id", tenantId)
        .gte("created_at", startDate.toISOString()),
      supabase
        .from("messages")
        .select("id, ticket_id, is_from_contact, created_at, sender_id")
        .in("ticket_id", (await supabase
          .from("tickets")
          .select("id")
          .eq("tenant_id", tenantId)
          .gte("created_at", startDate.toISOString())
        ).data?.map(t => t.id) || []),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("tenant_id", tenantId)
    ]);

    setTickets(ticketsRes.data || []);
    setMessages(messagesRes.data || []);
    setAgents(agentsRes.data || []);
    setLoading(false);
  };

  // Cálculos de métricas
  const calculateFirstResponseTime = () => {
    const ticketsWithResponse: number[] = [];
    
    tickets.forEach(ticket => {
      const ticketMessages = messages.filter(m => m.ticket_id === ticket.id);
      const contactMessage = ticketMessages.find(m => m.is_from_contact);
      const agentMessage = ticketMessages.find(m => !m.is_from_contact && m.sender_id);
      
      if (contactMessage && agentMessage) {
        const contactTime = new Date(contactMessage.created_at).getTime();
        const agentTime = new Date(agentMessage.created_at).getTime();
        if (agentTime > contactTime) {
          ticketsWithResponse.push((agentTime - contactTime) / 1000 / 60); // minutos
        }
      }
    });
    
    if (ticketsWithResponse.length === 0) return 0;
    return Math.round(ticketsWithResponse.reduce((a, b) => a + b, 0) / ticketsWithResponse.length);
  };

  const calculateResolutionTime = () => {
    const closedTickets = tickets.filter(t => t.closed_at);
    if (closedTickets.length === 0) return 0;
    
    const times = closedTickets.map(t => {
      const created = new Date(t.created_at).getTime();
      const closed = new Date(t.closed_at!).getTime();
      return (closed - created) / 1000 / 60 / 60; // horas
    });
    
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length * 10) / 10;
  };

  const calculateCSAT = () => {
    const evaluated = tickets.filter(t => t.evaluation_score);
    if (evaluated.length === 0) return 0;
    const avg = evaluated.reduce((sum, t) => sum + (t.evaluation_score || 0), 0) / evaluated.length;
    return Math.round(avg * 20); // Converter 1-5 para 0-100%
  };

  const firstResponseTime = calculateFirstResponseTime();
  const resolutionTime = calculateResolutionTime();
  const csat = calculateCSAT();
  const resolutionRate = tickets.length > 0 
    ? Math.round(tickets.filter(t => t.status === 'closed').length / tickets.length * 100)
    : 0;

  // Dados para gráficos
  const ticketsByDay = () => {
    const days = parseInt(dateRange);
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const count = tickets.filter(t => {
        const created = new Date(t.created_at);
        return created >= dayStart && created <= dayEnd;
      }).length;
      data.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        tickets: count
      });
    }
    return data;
  };

  const ticketsByChannel = () => {
    const channels: Record<string, number> = {};
    tickets.forEach(t => {
      channels[t.channel] = (channels[t.channel] || 0) + 1;
    });
    return Object.entries(channels).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  };

  const agentPerformance = () => {
    return agents.map(agent => {
      const agentTickets = tickets.filter(t => t.assigned_to === agent.id);
      const closedTickets = agentTickets.filter(t => t.status === 'closed');
      const evaluatedTickets = agentTickets.filter(t => t.evaluation_score);
      const avgScore = evaluatedTickets.length > 0
        ? evaluatedTickets.reduce((sum, t) => sum + (t.evaluation_score || 0), 0) / evaluatedTickets.length
        : 0;
      
      return {
        name: agent.full_name.split(' ')[0],
        fullName: agent.full_name,
        tickets: agentTickets.length,
        closed: closedTickets.length,
        rating: Math.round(avgScore * 10) / 10
      };
    }).filter(a => a.tickets > 0).sort((a, b) => b.tickets - a.tickets);
  };

  const hourlyHeatmap = () => {
    const hours = Array(24).fill(0);
    tickets.forEach(t => {
      const hour = new Date(t.created_at).getHours();
      hours[hour]++;
    });
    return hours.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      tickets: count,
      intensity: Math.min(count / Math.max(...hours), 1)
    }));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Avançado</h1>
            <p className="text-muted-foreground">Métricas detalhadas de atendimento</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Primeira Resposta</p>
                  <p className="text-3xl font-bold">{firstResponseTime} min</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio Resolução</p>
                  <p className="text-3xl font-bold">{resolutionTime}h</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Timer className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Satisfação (CSAT)</p>
                  <p className="text-3xl font-bold">{csat}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Star className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Resolução</p>
                  <p className="text-3xl font-bold">{resolutionRate}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="volume" className="space-y-4">
          <TabsList>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="channels">Canais</TabsTrigger>
            <TabsTrigger value="agents">Agentes</TabsTrigger>
            <TabsTrigger value="hours">Horários</TabsTrigger>
          </TabsList>

          <TabsContent value="volume">
            <Card>
              <CardHeader>
                <CardTitle>Volume de Tickets por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ticketsByDay()}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="tickets" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.2}
                        name="Tickets"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Canal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ticketsByChannel()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {ticketsByChannel().map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tickets por Canal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ticketsByChannel()} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Agente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentPerformance()}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => {
                          if (name === 'rating') return [`${value}/5`, 'Avaliação'];
                          return [value, name === 'tickets' ? 'Total' : 'Resolvidos'];
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="tickets" fill="hsl(var(--primary))" name="Total" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="closed" fill="hsl(var(--secondary))" name="Resolvidos" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="rating" fill="#F59E0B" name="Avaliação" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle>Horários de Pico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-12 gap-1">
                  {hourlyHeatmap().map((item, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded flex items-center justify-center text-xs font-medium"
                      style={{
                        backgroundColor: `hsl(var(--primary) / ${0.1 + item.intensity * 0.9})`,
                        color: item.intensity > 0.5 ? 'white' : 'hsl(var(--foreground))'
                      }}
                      title={`${item.hour}: ${item.tickets} tickets`}
                    >
                      {item.hour.split(':')[0]}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                  <span>Menos atendimentos</span>
                  <div className="flex gap-1">
                    {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity, i) => (
                      <div
                        key={i}
                        className="w-6 h-4 rounded"
                        style={{ backgroundColor: `hsl(var(--primary) / ${opacity})` }}
                      />
                    ))}
                  </div>
                  <span>Mais atendimentos</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
