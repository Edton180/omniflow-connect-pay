import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Clock, CheckCircle2, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AgentReports() {
  const { data: agentPerformance, isLoading } = useQuery({
    queryKey: ["agent-performance"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_agent_performance");
      if (error) throw error;
      return data;
    },
  });

  const formatMinutes = (minutes: number | null) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Relatórios de Agentes
          </h1>
          <p className="text-muted-foreground mt-1">
            Desempenho individual dos agentes (últimos 30 dias)
          </p>
        </div>

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
            {agentPerformance.map((agent: any) => (
              <Card key={agent.agent_id} className="p-6 hover:shadow-lg transition-shadow">
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
                  <div>
                    <h3 className="font-semibold">{agent.full_name}</h3>
                    <p className="text-sm text-muted-foreground">Agente</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Total de Tickets</span>
                    </div>
                    <span className="font-semibold">{agent.total_tickets || 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Fechados</span>
                    </div>
                    <span className="font-semibold">{agent.closed_tickets || 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tempo Médio</span>
                    </div>
                    <span className="font-semibold">
                      {formatMinutes(agent.avg_resolution_min)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Satisfação</span>
                    </div>
                    <span className="font-semibold">
                      {agent.avg_satisfaction
                        ? `${agent.avg_satisfaction.toFixed(1)}/5`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado disponível</h3>
            <p className="text-muted-foreground">
              Não há relatórios de agentes para exibir no momento
            </p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
