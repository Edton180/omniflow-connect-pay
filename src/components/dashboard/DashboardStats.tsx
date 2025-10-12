import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Clock, Workflow, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Stats {
  openTickets: number;
  totalContacts: number;
  activeQueues: number;
  avgResponseTime: string;
  ticketsTrend: number;
  contactsTrend: number;
}

export const DashboardStats = () => {
  const { session } = useAuth();
  const [stats, setStats] = useState<Stats>({
    openTickets: 0,
    totalContacts: 0,
    activeQueues: 0,
    avgResponseTime: "-",
    ticketsTrend: 0,
    contactsTrend: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadStats();
    }
  }, [session]);

  const loadStats = async () => {
    try {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", session?.user?.id)
        .single();

      if (!userRole?.tenant_id) return;

      // Get open tickets count
      const { count: openTicketsCount } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", userRole.tenant_id)
        .eq("status", "open");

      // Get total contacts
      const { count: contactsCount } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", userRole.tenant_id);

      // Get active queues
      const { count: queuesCount } = await supabase
        .from("queues")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", userRole.tenant_id)
        .eq("is_active", true);

      // Calculate average response time (simplified)
      const { data: recentTickets } = await supabase
        .from("tickets")
        .select("created_at, updated_at")
        .eq("tenant_id", userRole.tenant_id)
        .eq("status", "closed")
        .order("closed_at", { ascending: false })
        .limit(10);

      let avgTime = "-";
      if (recentTickets && recentTickets.length > 0) {
        const totalMinutes = recentTickets.reduce((acc, ticket) => {
          const diff = new Date(ticket.updated_at).getTime() - new Date(ticket.created_at).getTime();
          return acc + diff / (1000 * 60);
        }, 0);
        const avg = Math.round(totalMinutes / recentTickets.length);
        avgTime = `${avg}min`;
      }

      // Get tickets from last week for trend
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const { count: lastWeekTickets } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", userRole.tenant_id)
        .gte("created_at", lastWeek.toISOString());

      const { count: lastWeekContacts } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", userRole.tenant_id)
        .gte("created_at", lastWeek.toISOString());

      setStats({
        openTickets: openTicketsCount || 0,
        totalContacts: contactsCount || 0,
        activeQueues: queuesCount || 0,
        avgResponseTime: avgTime,
        ticketsTrend: lastWeekTickets || 0,
        contactsTrend: lastWeekContacts || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="gradient-card animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-24 mb-2"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-4 gap-6">
      <Card className="gradient-card hover-scale transition-all">
        <CardHeader className="pb-3">
          <CardDescription className="flex items-center justify-between">
            Tickets Abertos
            <MessageSquare className="w-4 h-4 text-primary" />
          </CardDescription>
          <CardTitle className="text-3xl">{stats.openTickets}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            {stats.ticketsTrend > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500">+{stats.ticketsTrend} esta semana</span>
              </>
            ) : (
              <span className="text-muted-foreground">Nenhum ticket esta semana</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card hover-scale transition-all">
        <CardHeader className="pb-3">
          <CardDescription className="flex items-center justify-between">
            Contatos
            <Users className="w-4 h-4 text-secondary" />
          </CardDescription>
          <CardTitle className="text-3xl">{stats.totalContacts}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            {stats.contactsTrend > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500">+{stats.contactsTrend} esta semana</span>
              </>
            ) : (
              <span className="text-muted-foreground">Nenhum contato novo</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card hover-scale transition-all">
        <CardHeader className="pb-3">
          <CardDescription className="flex items-center justify-between">
            Tempo Médio
            <Clock className="w-4 h-4 text-accent" />
          </CardDescription>
          <CardTitle className="text-3xl">{stats.avgResponseTime}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Tempo de resposta médio
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card hover-scale transition-all">
        <CardHeader className="pb-3">
          <CardDescription className="flex items-center justify-between">
            Filas Ativas
            <Workflow className="w-4 h-4 text-primary" />
          </CardDescription>
          <CardTitle className="text-3xl">{stats.activeQueues}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Configuradas e funcionando
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
