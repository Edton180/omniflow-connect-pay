import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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
      
      // Buscar avaliações (incluindo as sem agente para contagem)
      const { data: evaluations, error } = await supabase
        .from('evaluations')
        .select(`
          score,
          agent_id,
          ticket_id,
          created_at
        `)
        .eq('tenant_id', tenantRole.tenant_id);

      if (error) {
        console.error('❌ Erro ao buscar avaliações:', error);
        throw error;
      }

      console.log('📊 Avaliações carregadas:', evaluations?.length, evaluations);

      // Separar avaliações com e sem agente
      const evaluationsWithAgent = evaluations?.filter(e => e.agent_id) || [];
      const withoutAgent = evaluations?.filter(e => !e.agent_id).length || 0;
      setUnassignedCount(withoutAgent);
      console.log('⚠️ Avaliações sem agente:', withoutAgent);
      console.log('✅ Avaliações com agente:', evaluationsWithAgent.length);

      // Buscar perfis dos agentes (apenas avaliações COM agente)
      const agentIds = [...new Set(evaluationsWithAgent.map(e => e.agent_id).filter(Boolean))];
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

      // Agrupar por agente (apenas avaliações com agente)
      const statsMap = new Map<string, AgentStats>();
      
      evaluationsWithAgent.forEach((evaluation: any) => {
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

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

  const getOverallStats = () => {
    const total = rankings.reduce((sum, r) => sum + r.total_evaluations, 0);
    const avgScore = rankings.length > 0
      ? rankings.reduce((sum, r) => sum + (r.average_score * r.total_evaluations), 0) / total
      : 0;
    
    const scoreDistribution = [
      { name: '1 ⭐', value: rankings.reduce((sum, r) => sum + r.score_1, 0), color: COLORS[0] },
      { name: '2 ⭐', value: rankings.reduce((sum, r) => sum + r.score_2, 0), color: COLORS[1] },
      { name: '3 ⭐', value: rankings.reduce((sum, r) => sum + r.score_3, 0), color: COLORS[2] },
      { name: '4 ⭐', value: rankings.reduce((sum, r) => sum + r.score_4, 0), color: COLORS[3] },
      { name: '5 ⭐', value: rankings.reduce((sum, r) => sum + r.score_5, 0), color: COLORS[4] },
    ];

    return { total, avgScore, scoreDistribution };
  };

  const overallStats = getOverallStats();

  const topAgentsData = rankings.slice(0, 5).map(agent => ({
    name: agent.full_name.split(' ')[0],
    score: agent.average_score,
  }));

  return (
    <AppLayout>
      <div className="p-8 space-y-6">
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
              <div className="flex items-start gap-3 text-yellow-800 dark:text-yellow-200">
                <span className="text-3xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-bold text-lg mb-2">
                    {unassignedCount} avaliação{unassignedCount > 1 ? 'ões' : ''} não contabilizada{unassignedCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm mb-2">
                    Estas avaliações não aparecem no ranking porque os tickets não foram atribuídos a nenhum agente.
                  </p>
                  <p className="text-sm font-semibold bg-yellow-100 dark:bg-yellow-900 p-2 rounded">
                    ✅ SOLUÇÃO: No painel de atendimentos, ANTES de fechar um ticket, atribua-o a um agente usando o botão "Encaminhar" ou "Status".
                    Assim, quando o cliente avaliar, a nota será contabilizada para o agente correto.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {rankings.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Estatísticas Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Avaliações</p>
                  <p className="text-3xl font-bold">{overallStats.total}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média Geral</p>
                  <div className="flex items-center gap-2">
                    <Star className={`h-6 w-6 ${getScoreColor(overallStats.avgScore)} fill-current`} />
                    <p className={`text-3xl font-bold ${getScoreColor(overallStats.avgScore)}`}>
                      {overallStats.avgScore.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Agentes Avaliados</p>
                  <p className="text-2xl font-bold">{rankings.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Top 5 Agentes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topAgentsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis domain={[0, 5]} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {rankings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={overallStats.scoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {overallStats.scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Ranking de Agentes</h2>
          
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
            <Card key={agent.user_id} className="hover:shadow-lg transition-all hover-scale gradient-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {index < 3 && (
                        <div
                          className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
                            index === 0
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
                              : index === 1
                              ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white'
                              : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                          }`}
                        >
                          {index + 1}
                        </div>
                      )}
                      <Avatar className="h-16 w-16 border-2 border-primary">
                        <AvatarImage src={agent.avatar_url || ''} />
                        <AvatarFallback className="text-xl">{agent.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{agent.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.total_evaluations} avaliações</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <Star className={`h-8 w-8 ${getScoreColor(agent.average_score)} fill-current`} />
                      <span className={`text-3xl font-bold ${getScoreColor(agent.average_score)}`}>
                        {agent.average_score.toFixed(1)}
                      </span>
                    </div>
                    {index < 3 && (
                      <Badge variant="secondary" className="text-xs">
                        {index === 0 ? '🏆 1º Lugar' : index === 1 ? '🥈 2º Lugar' : '🥉 3º Lugar'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Distribuição de Notas</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((score) => {
                      const count = (agent as any)[`score_${score}`];
                      const percentage = (count / agent.total_evaluations) * 100;
                      return (
                        <div key={score} className="text-center space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">{score} ⭐</div>
                          <Badge 
                            variant="outline" 
                            className="w-full justify-center"
                            style={{ borderColor: COLORS[score - 1], color: COLORS[score - 1] }}
                          >
                            {count}
                          </Badge>
                          <div className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}