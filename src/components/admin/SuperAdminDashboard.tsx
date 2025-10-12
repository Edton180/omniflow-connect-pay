import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Ticket, MessageSquare, Settings, LogOut, Zap, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const SuperAdminDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white shadow-glow">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">OmniFlow</h1>
              <p className="text-xs text-muted-foreground">Super Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/profile')}>
              Meu Perfil
            </Button>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gradient">Super Admin Dashboard</h2>
          <p className="text-muted-foreground">Gerenciar todos os tenants e configurações do sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tenants</CardTitle>
              <Building2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Nenhum tenant ainda</p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1</div>
              <p className="text-xs text-muted-foreground mt-1">Você</p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Ativos</CardTitle>
              <Ticket className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Nenhum ticket ainda</p>
            </CardContent>
          </Card>

          <Card className="gradient-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
              <MessageSquare className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Nenhuma mensagem ainda</p>
            </CardContent>
          </Card>
        </div>

        <Card className="gradient-card">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Gerencie sua plataforma multi-tenant</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Button 
              className="h-20 text-lg hover-scale" 
              variant="outline"
              onClick={() => navigate('/admin/tenants')}
            >
              <Building2 className="mr-2 h-5 w-5" />
              Gerenciar Tenants
            </Button>
            <Button 
              className="h-20 text-lg hover-scale" 
              variant="outline"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="mr-2 h-5 w-5" />
              Gerenciar Usuários
            </Button>
            <Button 
              className="h-20 text-lg hover-scale" 
              variant="outline"
              onClick={() => navigate('/payments')}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Planos e Pagamentos
            </Button>
            <Button 
              className="h-20 text-lg hover-scale" 
              variant="outline"
              onClick={() => navigate('/admin/settings')}
            >
              <Settings className="mr-2 h-5 w-5" />
              Configurações do Sistema
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};