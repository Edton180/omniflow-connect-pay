import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SuperAdminDashboard } from "@/components/admin/SuperAdminDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Zap, 
  MessageSquare, 
  Users, 
  Settings,
  LogOut,
  BarChart3,
  Workflow
} from "lucide-react";

const Dashboard = () => {
  const { user, session, loading, signOut, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = () => {
    signOut();
  };

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">OmniFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {session?.user?.email}
              </span>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de controle OmniFlow
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="gradient-card hover-scale cursor-pointer" onClick={() => navigate("/tickets")}>
            <CardHeader className="pb-3">
              <CardDescription>Tickets Abertos</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span>Nenhum ticket ainda</span>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale cursor-pointer" onClick={() => navigate("/contacts")}>
            <CardHeader className="pb-3">
              <CardDescription>Contatos</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Adicione contatos</span>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="pb-3">
              <CardDescription>Tempo Médio</CardDescription>
              <CardTitle className="text-3xl">-</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="w-4 h-4" />
                <span>Sem dados ainda</span>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="pb-3">
              <CardDescription>Filas Ativas</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Workflow className="w-4 h-4" />
                <span>Configure filas</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Primeiros Passos</CardTitle>
            <CardDescription>
              Configure sua plataforma em minutos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-4 px-6 hover-scale"
                onClick={() => navigate("/tickets")}
              >
                <div className="flex items-start gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Gerenciar Tickets</div>
                    <div className="text-sm text-muted-foreground">
                      Visualize e gerencie atendimentos
                    </div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4 px-6 hover-scale"
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
                className="justify-start h-auto py-4 px-6 hover-scale"
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
                className="justify-start h-auto py-4 px-6 hover-scale"
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
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
