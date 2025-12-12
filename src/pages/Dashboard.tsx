import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { SuperAdminDashboard } from "@/components/admin/SuperAdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, MessageSquare, BarChart3 } from "lucide-react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { TicketsChart } from "@/components/dashboard/TicketsChart";
import { ChannelStats } from "@/components/dashboard/ChannelStats";
import { AppLayout } from "@/components/layout/AppLayout";

const Dashboard = () => {
  const { user, loading, isSuperAdmin } = useAuth();
  const { t } = useLanguage();
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
          <p className="text-muted-foreground">{t('common.loading')}</p>
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
              <h1 className="text-3xl font-bold mb-2">{t('dashboard.controlPanel')}</h1>
              <p className="text-muted-foreground">
                {t('dashboard.welcomeMessage')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground font-medium">{t('dashboard.dateFilter')}:</label>
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
                {t('dashboard.generate')}
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
                {t('dashboard.weeklyMetrics')}
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
                {t('dashboard.connectedChannels')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChannelStats />
            </CardContent>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
};

export default Dashboard;