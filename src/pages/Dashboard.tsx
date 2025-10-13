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
  Workflow,
  CreditCard,
  Palette,
  FileText,
  Users2,
  MessageCircle,
  ShoppingBag,
  Globe,
  DollarSign,
  Wallet,
  Layout
} from "lucide-react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { TicketsChart } from "@/components/dashboard/TicketsChart";
import { ChannelStats } from "@/components/dashboard/ChannelStats";
import { useBranding } from "@/hooks/useBranding";
import { ThemeToggle } from "@/components/ThemeToggle";

const Dashboard = () => {
  const { user, session, loading, signOut, isSuperAdmin, hasRole } = useAuth();
  const { branding } = useBranding();
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {branding.logo_url ? (
                <img
                  src={branding.logo_url}
                  alt={branding.name}
                  className="w-10 h-10 rounded-xl object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {branding.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground/70 hidden sm:inline font-medium">
                {session?.user?.email}
              </span>
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-primary/10"
                onClick={() => navigate("/tenant/settings")}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:bg-destructive/10">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Page Title and Date Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Painel de Controle</h1>
            <p className="text-foreground/60">
              Bem-vindo ao seu painel de controle OmniFlow
            </p>
          </div>
            <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-foreground/70 font-medium">Data Atendimento:</label>
              <input 
                type="date" 
                className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
              <span className="text-foreground/70">-</span>
              <input 
                type="date" 
                className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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
            <CardDescription className="text-foreground/60">
              Configure sua plataforma em minutos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button 
                variant="default" 
                className="justify-start h-auto py-4 px-6 hover-scale bg-gradient-primary shadow-glow hover:shadow-lg border-2 border-primary/20"
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
                className="justify-start h-auto py-4 px-6 hover-scale"
                onClick={() => navigate("/contacts")}
              >
                <div className="flex items-start gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Gerenciar Contatos</div>
                    <div className="text-sm text-foreground/60">
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
                    <div className="text-sm text-foreground/60">
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
                    <div className="text-sm text-foreground/60">
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
                    <div className="text-sm text-foreground/60">
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
                    <div className="text-sm text-foreground/60">
                      Comunicação entre equipes
                    </div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4 px-6 hover-scale"
                onClick={() => navigate("/catalog")}
              >
                <div className="flex items-start gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Catálogo Online</div>
                    <div className="text-sm text-foreground/60">
                      Gerencie produtos e vendas
                    </div>
                  </div>
                </div>
              </Button>

              {hasRole('tenant_admin') && !hasRole('super_admin') && (
                <>
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 px-6 hover-scale"
                    onClick={() => navigate("/tenant/settings")}
                  >
                    <div className="flex items-start gap-4 text-left">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <Settings className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">Configurações da Empresa</div>
                        <div className="text-sm text-foreground/60">
                          Gerencie sua empresa e usuários
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 px-6 hover-scale"
                    onClick={() => navigate("/tenant/invoices")}
                  >
                    <div className="flex items-start gap-4 text-left">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">Faturas</div>
                        <div className="text-sm text-foreground/60">
                          Visualize e pague suas faturas
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 px-6 hover-scale"
                    onClick={() => navigate("/withdrawals")}
                  >
                    <div className="flex items-start gap-4 text-left">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">Saques</div>
                        <div className="text-sm text-foreground/60">
                          Solicite e acompanhe saques
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 px-6 hover-scale"
                    onClick={() => navigate("/catalog-landing-editor")}
                  >
                    <div className="flex items-start gap-4 text-left">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Layout className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">Editar Landing Page</div>
                        <div className="text-sm text-foreground/60">
                          Personalize seu catálogo online
                        </div>
                      </div>
                    </div>
                  </Button>
                </>
              )}

              {hasRole('super_admin') && (
                <>
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 px-6 hover-scale"
                    onClick={() => navigate("/payments")}
                  >
                    <div className="flex items-start gap-4 text-left">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">Configurar Pagamentos</div>
                        <div className="text-sm text-foreground/60">
                          Gateways e assinaturas
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 px-6 hover-scale"
                    onClick={() => navigate("/branding")}
                  >
                    <div className="flex items-start gap-4 text-left">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <Palette className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">Marca Branca</div>
                        <div className="text-sm text-foreground/60">
                          Personalize sua plataforma
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 px-6 hover-scale"
                    onClick={() => navigate("/landing-page-editor")}
                  >
                    <div className="flex items-start gap-4 text-left">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Layout className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">Editar Landing Geral</div>
                        <div className="text-sm text-foreground/60">
                          Personalize a página principal
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 px-6 hover-scale"
                    onClick={() => navigate("/admin/withdrawals")}
                  >
                    <div className="flex items-start gap-4 text-left">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">Gerenciar Saques</div>
                        <div className="text-sm text-foreground/60">
                          Aprovar e processar solicitações
                        </div>
                      </div>
                    </div>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
