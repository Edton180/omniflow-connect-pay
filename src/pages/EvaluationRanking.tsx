import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, TrendingUp, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';

interface AgentStats {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_evaluations: number;
  average_score: number;
  score_1: number;
  score_2: number;
  score_3: number;
  score_4: number;
  score_5: number;
}

export default function EvaluationRanking() {
  const { roles } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<AgentStats[]>([]);

  useEffect(() => {
    fetchRankings();
  }, [roles]);

  const fetchRankings = async () => {
    const tenantRole = roles?.find((r) => r.tenant_id);
    if (!tenantRole?.tenant_id) return;

    setLoading(true);
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          assigned_to,
          evaluation_score,
          assigned:profiles!assigned_to(full_name, avatar_url)
        `)
        .eq('tenant_id', tenantRole.tenant_id)
        .not('evaluation_score', 'is', null)
        .not('assigned_to', 'is', null);

      if (error) throw error;

      // Agrupar por agente
      const statsMap = new Map<string, AgentStats>();
      
      tickets?.forEach((ticket: any) => {
        const userId = ticket.assigned_to;
        if (!userId || !ticket.assigned) return;

        if (!statsMap.has(userId)) {
          statsMap.set(userId, {
            user_id: userId,
            full_name: ticket.assigned.full_name,
            avatar_url: ticket.assigned.avatar_url,
            total_evaluations: 0,
            average_score: 0,
            score_1: 0,
            score_2: 0,
            score_3: 0,
            score_4: 0,
            score_5: 0,
          });
        }

        const stats = statsMap.get(userId)!;
        stats.total_evaluations++;
        
        const score = ticket.evaluation_score;
        if (score === 1) stats.score_1++;
        else if (score === 2) stats.score_2++;
        else if (score === 3) stats.score_3++;
        else if (score === 4) stats.score_4++;
        else if (score === 5) stats.score_5++;
      });

      // Calcular média
      const rankings = Array.from(statsMap.values()).map((stat) => ({
        ...stat,
        average_score:
          (stat.score_1 * 1 +
            stat.score_2 * 2 +
            stat.score_3 * 3 +
            stat.score_4 * 4 +
            stat.score_5 * 5) /
          stat.total_evaluations,
      }));

      // Ordenar por média decrescente
      rankings.sort((a, b) => b.average_score - a.average_score);
      setRankings(rankings);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-500';
    if (score >= 3.5) return 'text-blue-500';
    if (score >= 2.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Award className="h-8 w-8" />
            Ranking de Avaliações
          </h1>
          <p className="text-muted-foreground">Desempenho dos atendentes baseado em avaliações dos clientes</p>
        </div>

        <div className="grid gap-4">
          {rankings.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma avaliação registrada ainda
              </CardContent>
            </Card>
          )}

          {rankings.map((agent, index) => (
            <Card key={agent.user_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {index < 3 && (
                        <div
                          className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0
                              ? 'bg-yellow-500 text-white'
                              : index === 1
                              ? 'bg-gray-400 text-white'
                              : 'bg-orange-600 text-white'
                          }`}
                        >
                          {index + 1}
                        </div>
                      )}
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={agent.avatar_url || ''} />
                        <AvatarFallback>{agent.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{agent.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.total_evaluations} avaliações</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className={`h-8 w-8 ${getScoreColor(agent.average_score)} fill-current`} />
                    <span className={`text-3xl font-bold ${getScoreColor(agent.average_score)}`}>
                      {agent.average_score.toFixed(1)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((score) => {
                    const count = (agent as any)[`score_${score}`];
                    const percentage = (count / agent.total_evaluations) * 100;
                    return (
                      <div key={score} className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">{score} ⭐</div>
                        <Badge variant="outline" className="w-full">
                          {count}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">{percentage.toFixed(0)}%</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}