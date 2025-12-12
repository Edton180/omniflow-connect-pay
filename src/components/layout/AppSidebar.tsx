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
  ChevronRight,
  TrendingUp,
  Building2,
  Kanban,
  Activity,
  Shield,
  Keyboard,
  Link2,
  Bot,
  Send,
  FileCode,
  Webhook,
  Download,
  Receipt,
  BarChart2,
  Database
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useBranding } from "@/hooks/useBranding";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { LanguageSelector } from "@/components/LanguageSelector";

interface NavItem {
  titleKey: string;
  href: string;
  icon: any;
  roles?: string[];
}

// Itens de navegação principal - apenas para usuários com tenant (empresas)
const navItems: NavItem[] = [
  { titleKey: "navigation.dashboard", href: "/dashboard", icon: Home },
  { titleKey: "navigation.tickets", href: "/view-tickets", icon: MessageSquare },
  { titleKey: "navigation.contacts", href: "/contacts", icon: Users },
  { titleKey: "navigation.queues", href: "/queues", icon: Workflow },
  { titleKey: "navigation.channels", href: "/channels", icon: Globe },
  { titleKey: "navigation.crm", href: "/crm", icon: Users2 },
  { titleKey: "navigation.internalChat", href: "/internal-chat", icon: MessageCircle },
  { titleKey: "navigation.broadcast", href: "/broadcast", icon: Send },
  { titleKey: "navigation.templates", href: "/whatsapp-templates", icon: FileCode },
  { titleKey: "navigation.evaluations", href: "/evaluation-ranking", icon: TrendingUp },
];

// Administração da Empresa (apenas tenant_admin, NÃO super admin)
const adminItems: NavItem[] = [
  { titleKey: "navigation.settings", href: "/tenant/settings", icon: Settings, roles: ["tenant_admin"] },
  { titleKey: "navigation.invoices", href: "/tenant/invoices", icon: FileText, roles: ["tenant_admin"] },
  { titleKey: "navigation.n8nIntegration", href: "/n8n-integration", icon: Webhook, roles: ["tenant_admin"] },
  { titleKey: "navigation.agentReports", href: "/agent-reports", icon: Activity, roles: ["tenant_admin"] },
  { titleKey: "navigation.analytics", href: "/advanced-analytics", icon: BarChart2, roles: ["tenant_admin"] },
  { titleKey: "navigation.chatbot", href: "/chatbot-settings", icon: Bot, roles: ["tenant_admin"] },
  { titleKey: "navigation.exportReports", href: "/export-reports", icon: Download, roles: ["tenant_admin"] },
  { titleKey: "navigation.transactions", href: "/transactions", icon: Receipt, roles: ["tenant_admin"] },
];

// Painel Super Admin - métricas e gestão global do sistema (EXCLUSIVO super admin)
const superAdminItems: NavItem[] = [
  { titleKey: "navigation.allCompanies", href: "/admin/tenants", icon: Building2, roles: ["super_admin"] },
  { titleKey: "navigation.allUsers", href: "/admin/users", icon: Users, roles: ["super_admin"] },
  { titleKey: "navigation.allChannels", href: "/admin/all-channels", icon: Globe, roles: ["super_admin"] },
  { titleKey: "navigation.allTickets", href: "/admin/all-tickets", icon: BarChart3, roles: ["super_admin"] },
  { titleKey: "navigation.allCRM", href: "/admin/all-crm", icon: Kanban, roles: ["super_admin"] },
  { titleKey: "navigation.globalAI", href: "/admin/ai-config", icon: Bot, roles: ["super_admin"] },
  { titleKey: "navigation.payments", href: "/payments", icon: CreditCard, roles: ["super_admin"] },
  { titleKey: "navigation.proofs", href: "/admin/payment-proofs", icon: FileText, roles: ["super_admin"] },
  { titleKey: "navigation.webhooksDashboard", href: "/webhooks", icon: Zap, roles: ["super_admin"] },
  { titleKey: "navigation.webhooksConfig", href: "/webhook-config", icon: Link2, roles: ["super_admin"] },
  { titleKey: "navigation.financialReports", href: "/financial-reports", icon: TrendingUp, roles: ["super_admin"] },
  { titleKey: "navigation.revenue", href: "/admin/revenue", icon: DollarSign, roles: ["super_admin"] },
  { titleKey: "navigation.branding", href: "/branding", icon: Palette, roles: ["super_admin"] },
  { titleKey: "navigation.landingPage", href: "/landing-page-editor", icon: Layout, roles: ["super_admin"] },
  { titleKey: "navigation.globalThemes", href: "/admin/themes", icon: Palette, roles: ["super_admin"] },
  { titleKey: "navigation.allInvoices", href: "/admin/invoices", icon: FileText, roles: ["super_admin"] },
  { titleKey: "navigation.agentReports", href: "/agent-reports", icon: Activity, roles: ["super_admin"] },
  { titleKey: "navigation.auditLogs", href: "/audit-logs", icon: Shield, roles: ["super_admin"] },
  { titleKey: "navigation.backup", href: "/admin/backup", icon: Database, roles: ["super_admin"] },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const { branding } = useBranding();
  const { hasRole, isSuperAdmin, signOut, roles } = useAuth();
  const { t } = useLanguage();
  
  // Super Admin pode ter ou não um tenant associado
  const hasTenant = roles?.some(r => r.tenant_id !== null);

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
        {/* Mostrar itens de navegação comum para TODOS os usuários incluindo Super Admin */}
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
            {!collapsed && <span>{t(item.titleKey)}</span>}
          </NavLink>
        ))}

        {/* Administração da Empresa - para tenant_admin (não super admin) */}
        {hasRole("tenant_admin") && !isSuperAdmin && (
          <>
            <div className={cn("px-3 py-2 mt-4", collapsed ? "hidden" : "block")}>
              <span className="text-xs font-semibold text-primary-foreground/60 uppercase">
                {t('navigation.administration')}
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
                {!collapsed && <span>{t(item.titleKey)}</span>}
              </NavLink>
            ))}
          </>
        )}

        {/* Painel Super Admin - sempre visível para super admin */}
        {isSuperAdmin && (
          <>
            <div className={cn("px-3 py-2 mt-4", collapsed ? "hidden" : "block")}>
              <span className="text-xs font-semibold text-primary-foreground/60 uppercase">
                {t('navigation.superAdminPanel')}
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
                {!collapsed && <span>{t(item.titleKey)}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-primary-light/20 space-y-1">
        {/* Language Selector */}
        {!collapsed && (
          <div className="px-2 py-1">
            <LanguageSelector variant="ghost" size="sm" className="w-full justify-start text-primary-foreground hover:bg-white/10 hover:text-white" />
          </div>
        )}
        <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "px-2")}>
          <ThemeToggle />
          {!collapsed && <span className="text-sm text-primary-foreground/80">{t('navigation.theme')}</span>}
        </div>
        <Button
          variant="ghost"
          onClick={() => setShowShortcutsHelp(true)}
          className={cn(
            "w-full hover:bg-white/10 text-primary-foreground hover:text-white",
            collapsed ? "justify-center px-2" : "justify-start"
          )}
        >
          <Keyboard className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="ml-3">{t('navigation.shortcuts')}</span>}
        </Button>
        <Button
          variant="ghost"
          onClick={signOut}
          className={cn(
            "w-full hover:bg-white/10 text-primary-foreground hover:text-white",
            collapsed ? "justify-center px-2" : "justify-start"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="ml-3">{t('navigation.logout')}</span>}
        </Button>
      </div>

      <KeyboardShortcutsHelp 
        open={showShortcutsHelp} 
        onOpenChange={setShowShortcutsHelp} 
      />
    </aside>
  );
}