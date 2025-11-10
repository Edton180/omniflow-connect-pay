import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Star, ThumbsUp, ThumbsDown, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function EvaluationDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    excellent: 0,
    good: 0,
    poor: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!userRole?.tenant_id) return;

      // Load evaluations
      const { data: evalData, error: evalError } = await supabase
        .from("evaluations")
        .select(`
          *,
          ticket:tickets(id, channel),
          contact:contacts(name, phone),
          agent:profiles!evaluations_agent_id_fkey(full_name)
        `)
        .eq("tenant_id", userRole.tenant_id)
        .order("created_at", { ascending: false });

      if (evalError) throw evalError;

      // Load rankings
      const { data: rankData, error: rankError } = await supabase
        .from("evaluation_rankings")
        .select("*")
        .eq("tenant_id", userRole.tenant_id)
        .order("average_score", { ascending: false });

      if (rankError) throw rankError;

      setEvaluations(evalData || []);
      setRankings(rankData || []);

      // Calculate stats
      const total = evalData?.length || 0;
      const sum = evalData?.reduce((acc, e) => acc + e.score, 0) || 0;
      const average = total > 0 ? sum / total : 0;
      const excellent = evalData?.filter((e) => e.score >= 4).length || 0;
      const good = evalData?.filter((e) => e.score === 3).length || 0;
      const poor = evalData?.filter((e) => e.score <= 2).length || 0;

      setStats({ total, average, excellent, good, poor });
    } catch (error: any) {
      console.error("Error loading evaluation data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPieData = () => [
    { name: "Excelente (4-5)", value: stats.excellent, color: "#22c55e" },
    { name: "Bom (3)", value: stats.good, color: "#eab308" },
    { name: "Ruim (1-2)", value: stats.poor, color: "#ef4444" },
  ];

  const getChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    return last7Days.map((date) => {
      const dayEvals = evaluations.filter(
        (e) => e.created_at.split("T")[0] === date
      );
      const avg =
        dayEvals.length > 0
          ? dayEvals.reduce((acc, e) => acc + e.score, 0) / dayEvals.length
          : 0;

      return {
        date: new Date(date).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        evaluations: dayEvals.length,
        average: Number(avg.toFixed(2)),
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Avaliações</h1>
          <p className="text-muted-foreground">
            Métricas e análise de satisfação do cliente
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média Geral</p>
                <p className="text-3xl font-bold">{stats.average.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Excelente</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.excellent}
                </p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ruim</p>
                <p className="text-3xl font-bold text-red-600">{stats.poor}</p>
              </div>
              <ThumbsDown className="h-8 w-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Distribuição de Avaliações
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getPieData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getPieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Avaliações dos Últimos 7 Dias
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="evaluations"
                  stroke="#8b5cf6"
                  name="Quantidade"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="average"
                  stroke="#22c55e"
                  name="Média"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Agent Rankings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Ranking de Agentes</h2>
          <div className="space-y-3">
            {rankings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum dado de ranking disponível
              </p>
            ) : (
              rankings.map((rank, index) => (
                <div
                  key={rank.agent_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{rank.agent_name || "Sem nome"}</p>
                      <p className="text-sm text-muted-foreground">
                        {rank.total_evaluations} avaliações
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {Number(rank.average_score).toFixed(2)}
                      </p>
                      <div className="flex gap-1 text-xs">
                        <span className="text-green-600">
                          ✓ {rank.excellent_count}
                        </span>
                        <span className="text-red-600">✗ {rank.poor_count}</span>
                      </div>
                    </div>
                    {Number(rank.average_score) >= 4 ? (
                      <Badge className="bg-green-500">Excelente</Badge>
                    ) : Number(rank.average_score) >= 3 ? (
                      <Badge className="bg-yellow-500">Bom</Badge>
                    ) : (
                      <Badge variant="destructive">Precisa Melhorar</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Evaluations */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Avaliações Recentes</h2>
          <div className="space-y-3">
            {evaluations.slice(0, 10).map((evaluation) => (
              <div
                key={evaluation.id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">
                      {evaluation.contact?.name || "Cliente"}
                    </p>
                    <Badge variant="outline">{evaluation.ticket?.channel}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Atendente: {evaluation.agent?.full_name || "Não atribuído"}
                  </p>
                  {evaluation.feedback && (
                    <p className="text-sm italic">{evaluation.feedback}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(evaluation.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < evaluation.score
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-bold">{evaluation.score}/5</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
