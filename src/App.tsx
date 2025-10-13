import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import TicketsImproved from "./pages/TicketsImproved";
import TicketDetail from "./pages/TicketDetail";
import Contacts from "./pages/Contacts";
import Queues from "./pages/Queues";
import Channels from "./pages/Channels";
import Payments from "./pages/Payments";
import Branding from "./pages/Branding";
import BaileysTest from "./pages/BaileysTest";
import Invoices from "./pages/Invoices";
import NotFound from "./pages/NotFound";
import { TenantManagement } from "./components/admin/TenantManagement";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import SystemReset from "./pages/SystemReset";
import ForceLogout from "./pages/ForceLogout";
import TenantSettings from "./pages/TenantSettings";
import LandingPageEditor from "./pages/LandingPageEditor";
import { SetupWizard } from "./components/SetupWizard";
import Revenue from "./pages/Revenue";
import CRM from "./pages/CRM";
import InternalChat from "./pages/InternalChat";
import SuperAdminTickets from "./pages/SuperAdminTickets";
import ViewTickets from "./pages/ViewTickets";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="/force-logout" element={<ForceLogout />} />
          <Route path="/system-reset" element={<SystemReset />} />
          <Route path="/dashboard" element={<AuthGuard requireAuth><Dashboard /></AuthGuard>} />
          <Route path="/view-tickets" element={<AuthGuard requireAuth><ViewTickets /></AuthGuard>} />
          <Route path="/tickets" element={<AuthGuard requireAuth><Tickets /></AuthGuard>} />
          <Route path="/tickets-improved" element={<AuthGuard requireAuth><TicketsImproved /></AuthGuard>} />
          <Route path="/tickets/:id" element={<AuthGuard requireAuth><TicketDetail /></AuthGuard>} />
          <Route path="/contacts" element={<AuthGuard requireAuth><Contacts /></AuthGuard>} />
          <Route path="/queues" element={<AuthGuard requireAuth><Queues /></AuthGuard>} />
          <Route path="/channels" element={<AuthGuard requireAuth><Channels /></AuthGuard>} />
          <Route path="/baileys-test" element={<AuthGuard requireAuth><BaileysTest /></AuthGuard>} />
          <Route path="/payments" element={<AuthGuard requireAuth requiredRoles={['super_admin']}><Payments /></AuthGuard>} />
          <Route path="/branding" element={<AuthGuard requireAuth requiredRoles={['super_admin']}><Branding /></AuthGuard>} />
          <Route path="/landing-page-editor" element={<AuthGuard requireAuth requiredRoles={['super_admin']}><LandingPageEditor /></AuthGuard>} />
          <Route path="/admin/tenants" element={<AuthGuard requireAuth requiredRoles={['super_admin']}><TenantManagement /></AuthGuard>} />
          <Route path="/admin/users" element={<AuthGuard requireAuth requiredRoles={['super_admin']}><Users /></AuthGuard>} />
          <Route path="/admin/settings" element={<AuthGuard requireAuth requiredRoles={['super_admin']}><Settings /></AuthGuard>} />
          <Route path="/admin/revenue" element={<AuthGuard requireAuth requiredRoles={['super_admin']}><Revenue /></AuthGuard>} />
          <Route path="/admin/all-tickets" element={<AuthGuard requireAuth requiredRoles={['super_admin']}><SuperAdminTickets /></AuthGuard>} />
          <Route path="/tenant/settings" element={<AuthGuard requireAuth requiredRoles={['tenant_admin']}><TenantSettings /></AuthGuard>} />
          <Route path="/tenant/invoices" element={<AuthGuard requireAuth requiredRoles={['tenant_admin']}><Invoices /></AuthGuard>} />
          <Route path="/crm" element={<AuthGuard requireAuth><CRM /></AuthGuard>} />
          <Route path="/internal-chat" element={<AuthGuard requireAuth><InternalChat /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard requireAuth><Profile /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
