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
  const [unassignedCount, setUnassignedCount] = useState(0);

  useEffect(() => {
    fetchRankings();
  }, [roles]);

  const fetchRankings = async () => {
    const tenantRole = roles?.find((r) => r.tenant_id);
    if (!tenantRole?.tenant_id) return;

    setLoading(true);
    try {
      console.log('📊 Buscando avaliações para tenant:', tenantRole.tenant_id);
      
      // Buscar avaliações com join de profiles
      const { data: evaluations, error } = await supabase
        .from('evaluations')
        .select(`
          score,
          agent_id,
          ticket_id,
          created_at
        `)
        .eq('tenant_id', tenantRole.tenant_id)
        .not('agent_id', 'is', null);

      if (error) {
        console.error('❌ Erro ao buscar avaliações:', error);
        throw error;
      }

      console.log('📊 Avaliações carregadas:', evaluations?.length, evaluations);

      // Contar avaliações sem agente atribuído
      const withoutAgent = evaluations?.filter(e => !e.agent_id).length || 0;
      setUnassignedCount(withoutAgent);
      console.log('⚠️ Avaliações sem agente:', withoutAgent);

      // Buscar perfis dos agentes (apenas avaliações COM agente)
      const agentIds = [...new Set(evaluations?.map(e => e.agent_id).filter(Boolean))];
      console.log('👥 Agent IDs encontrados:', agentIds);
      
      if (agentIds.length === 0) {
        console.log('⚠️ Nenhum agente encontrado nas avaliações');
        setRankings([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', agentIds);

      if (profilesError) {
        console.error('❌ Erro ao buscar perfis:', profilesError);
        throw profilesError;
      }

      console.log('👥 Perfis carregados:', profiles);

      // Agrupar por agente
      const statsMap = new Map<string, AgentStats>();
      
      evaluations?.forEach((evaluation: any) => {
        const userId = evaluation.agent_id;
        if (!userId) return;

        const profile = profiles?.find(p => p.id === userId);
        if (!profile) {
          console.warn('⚠️ Perfil não encontrado para agente:', userId);
          return;
        }

        if (!statsMap.has(userId)) {
          statsMap.set(userId, {
            user_id: userId,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
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
        
        const score = evaluation.score;
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
      
      console.log('📊 Rankings processados:', rankings);
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

        {unassignedCount > 0 && (
          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold">
                    {unassignedCount} avaliação{unassignedCount > 1 ? 'ões' : ''} não contabilizada{unassignedCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm">
                    Estas avaliações não aparecem no ranking porque os tickets não foram atribuídos a nenhum agente.
                    Para contabilizar, atribua os tickets aos agentes antes de fechá-los.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {rankings.length === 0 && !loading && unassignedCount === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma avaliação registrada ainda
              </CardContent>
            </Card>
          )}
          
          {rankings.length === 0 && !loading && unassignedCount > 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Não há avaliações de tickets atribuídos a agentes ainda
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