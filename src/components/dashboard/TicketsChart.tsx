import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const TicketsChart = () => {
  const { session } = useAuth();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadChartData();
    }
  }, [session]);

  const loadChartData = async () => {
    try {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", session?.user?.id)
        .single();

      if (!userRole?.tenant_id) return;

      // Get tickets from last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const data = await Promise.all(
        last7Days.map(async (date) => {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          const { count: openCount } = await supabase
            .from("tickets")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", userRole.tenant_id)
            .gte("created_at", startOfDay.toISOString())
            .lte("created_at", endOfDay.toISOString())
            .eq("status", "open");

          const { count: closedCount } = await supabase
            .from("tickets")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", userRole.tenant_id)
            .gte("closed_at", startOfDay.toISOString())
            .lte("closed_at", endOfDay.toISOString())
            .eq("status", "closed");

          return {
            name: date.toLocaleDateString("pt-BR", { weekday: "short" }),
            Abertos: openCount || 0,
            Fechados: closedCount || 0,
          };
        })
      );

      setChartData(data);
    } catch (error) {
      console.error("Error loading chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle>Tickets nos Últimos 7 Dias</CardTitle>
          <CardDescription>Visualização de abertura e fechamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/95">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Atendimento por tipo de canal</CardTitle>
        <CardDescription>Distribuição de tickets por canal nos últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis 
              dataKey="name" 
              className="text-xs" 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              cursor={{ fill: "hsl(var(--muted)/0.1)" }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
            />
            <Bar dataKey="Abertos" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Fechados" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
