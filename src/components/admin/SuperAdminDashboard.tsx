import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign,
  Plus,
  Settings
} from "lucide-react";

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  monthlyRevenue: number;
}

export const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch tenant stats
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("*");

      if (tenantsError) throw tenantsError;

      // Fetch user stats
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      setStats({
        totalTenants: tenants?.length || 0,
        activeTenants: tenants?.filter(t => t.is_active).length || 0,
        totalUsers: profiles?.length || 0,
        monthlyRevenue: 0, // Will be calculated from billing data
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Total Tenants",
      value: stats.totalTenants,
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Active Tenants",
      value: stats.activeTenants,
      icon: TrendingUp,
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      title: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gradient">Super Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your entire platform</p>
            </div>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Tenant
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="p-6 hover:shadow-glow transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Manage Tenants</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              View, create, and configure tenant organizations
            </p>
            <Button variant="outline" className="w-full">
              View Tenants
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-secondary/10">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold">User Management</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Manage users, roles, and permissions
            </p>
            <Button variant="outline" className="w-full">
              Manage Users
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Settings className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold">Platform Settings</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Configure global platform settings
            </p>
            <Button variant="outline" className="w-full">
              Settings
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
};
