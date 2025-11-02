import { 
  Home, 
  MessageSquare, 
  Users, 
  Workflow,
  Settings,
  CreditCard,
  Palette,
  FileText,
  Users2,
  MessageCircle,
  Globe,
  DollarSign,
  Layout,
  BarChart3,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useBranding } from "@/hooks/useBranding";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles?: string[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Atendimentos", href: "/view-tickets", icon: MessageSquare },
  { title: "Contatos", href: "/contacts", icon: Users },
  { title: "Filas", href: "/queues", icon: Workflow },
  { title: "Canais", href: "/channels", icon: Globe },
  { title: "CRM / Kanban", href: "/crm", icon: Users2 },
  { title: "Chat Interno", href: "/internal-chat", icon: MessageCircle },
];

const adminItems: NavItem[] = [
  { title: "Configurações", href: "/tenant/settings", icon: Settings, roles: ["tenant_admin"] },
  { title: "Faturas", href: "/tenant/invoices", icon: FileText, roles: ["tenant_admin"] },
];

const superAdminItems: NavItem[] = [
  { title: "Pagamentos", href: "/payments", icon: CreditCard, roles: ["super_admin"] },
  { title: "Marca Branca", href: "/branding", icon: Palette, roles: ["super_admin"] },
  { title: "Landing Page", href: "/landing-page-editor", icon: Layout, roles: ["super_admin"] },
  { title: "Receita", href: "/admin/revenue", icon: DollarSign, roles: ["super_admin"] },
  { title: "Todos Tickets", href: "/admin/all-tickets", icon: BarChart3, roles: ["super_admin"] },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { branding } = useBranding();
  const { hasRole, isSuperAdmin, signOut } = useAuth();

  const hasAccess = (item: NavItem) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some(role => {
      if (role === 'tenant_admin') return hasRole('tenant_admin');
      if (role === 'super_admin') return hasRole('super_admin');
      return false;
    });
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-gradient-to-b from-primary to-primary-dark text-primary-foreground transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-primary-light/20">
        {!collapsed && (
          <div className="flex items-center gap-3">
            {branding.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.name}
                className="w-8 h-8 rounded-lg object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
            )}
            <span className="font-bold text-lg">{branding.name}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-white/10 text-primary-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-white/20 text-white font-medium"
                  : "hover:bg-white/10 text-primary-foreground/80 hover:text-white"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}

        {(hasRole("tenant_admin") && !isSuperAdmin) && (
          <>
            <div className={cn("px-3 py-2 mt-4", collapsed ? "hidden" : "block")}>
              <span className="text-xs font-semibold text-primary-foreground/60 uppercase">
                Administração
              </span>
            </div>
            {adminItems.filter(hasAccess).map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-white/20 text-white font-medium"
                      : "hover:bg-white/10 text-primary-foreground/80 hover:text-white"
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            ))}
          </>
        )}

        {isSuperAdmin && (
          <>
            <div className={cn("px-3 py-2 mt-4", collapsed ? "hidden" : "block")}>
              <span className="text-xs font-semibold text-primary-foreground/60 uppercase">
                Super Admin
              </span>
            </div>
            {superAdminItems.filter(hasAccess).map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-white/20 text-white font-medium"
                      : "hover:bg-white/10 text-primary-foreground/80 hover:text-white"
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-primary-light/20 space-y-1">
        <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "px-2")}>
          <ThemeToggle />
          {!collapsed && <span className="text-sm text-primary-foreground/80">Tema</span>}
        </div>
        <Button
          variant="ghost"
          onClick={signOut}
          className={cn(
            "w-full hover:bg-white/10 text-primary-foreground hover:text-white",
            collapsed ? "justify-center px-2" : "justify-start"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="ml-3">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
