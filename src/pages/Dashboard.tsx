import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SuperAdminDashboard } from "@/components/admin/SuperAdminDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  MessageSquare, 
  Users, 
  Workflow,
  BarChart3,
  Users2,
  MessageCircle
} from "lucide-react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { TicketsChart } from "@/components/dashboard/TicketsChart";
import { ChannelStats } from "@/components/dashboard/ChannelStats";
import { AppLayout } from "@/components/layout/AppLayout";

const Dashboard = () => {
  const { user, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Show Super Admin Dashboard if user is super admin
  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  // Regular tenant dashboard
  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Page Title and Date Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Painel de Controle</h1>
              <p className="text-muted-foreground">
                Bem-vindo ao seu painel de controle
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground font-medium">Data Atendimento:</label>
                <input 
                  type="date" 
                  className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
                <span className="text-muted-foreground">-</span>
                <input 
                  type="date" 
                  className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              <Button 
                className="shadow-md hover:shadow-lg transition-all"
                onClick={() => window.location.reload()}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                GERAR
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-8">
          <DashboardStats />
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Métricas Semanais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TicketsChart />
            </CardContent>
          </Card>
          
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Canais Conectados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChannelStats />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle>Primeiros Passos</CardTitle>
            <CardDescription>
              Configure sua plataforma em minutos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                variant="default" 
                className="justify-start h-auto py-4 px-6 hover-scale bg-gradient-primary shadow-glow hover:shadow-lg border-2 border-primary/20 text-white"
                onClick={() => navigate("/view-tickets")}
              >
                <div className="flex items-start gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1 text-white">📞 Ver Atendimentos</div>
                    <div className="text-sm text-white/90">
                      Visualize e gerencie atendimentos em destaque
                    </div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4 px-6 hover-scale bg-card border-border hover:bg-accent/10"
                onClick={() => navigate("/contacts")}
              >
                <div className="flex items-start gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Gerenciar Contatos</div>
                    <div className="text-sm text-muted-foreground">
                      Adicione e organize seus contatos
                    </div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4 px-6 hover-scale bg-card border-border hover:bg-accent/10"
                onClick={() => navigate("/queues")}
              >
                <div className="flex items-start gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Workflow className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Configurar Filas</div>
                    <div className="text-sm text-muted-foreground">
                      Organize o fluxo de atendimento
                    </div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4 px-6 hover-scale bg-card border-border hover:bg-accent/10"
                onClick={() => navigate("/channels")}
              >
                <div className="flex items-start gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Conectar Canais</div>
                    <div className="text-sm text-muted-foreground">
                      WhatsApp, Instagram e mais
                    </div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4 px-6 hover-scale"
                onClick={() => navigate("/crm")}
              >
                <div className="flex items-start gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Users2 className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">CRM / Kanban</div>
                    <div className="text-sm text-muted-foreground">
                      Gerencie leads e oportunidades
                    </div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4 px-6 hover-scale"
                onClick={() => navigate("/internal-chat")}
              >
                <div className="flex items-start gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Chat Interno</div>
                    <div className="text-sm text-muted-foreground">
                      Comunicação entre equipes
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
