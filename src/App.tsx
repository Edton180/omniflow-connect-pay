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
import TicketDetail from "./pages/TicketDetail";
import Contacts from "./pages/Contacts";
import Queues from "./pages/Queues";
import Channels from "./pages/Channels";
import Payments from "./pages/Payments";
import Branding from "./pages/Branding";
import NotFound from "./pages/NotFound";
import { SetupWizard } from "./components/SetupWizard";
import { TenantManagement } from "./components/admin/TenantManagement";

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
          <Route path="/setup" element={<AuthGuard requireAuth><SetupWizard /></AuthGuard>} />
          <Route path="/dashboard" element={<AuthGuard requireAuth><Dashboard /></AuthGuard>} />
          <Route path="/tickets" element={<AuthGuard requireAuth><Tickets /></AuthGuard>} />
          <Route path="/tickets/:id" element={<AuthGuard requireAuth><TicketDetail /></AuthGuard>} />
          <Route path="/contacts" element={<AuthGuard requireAuth><Contacts /></AuthGuard>} />
          <Route path="/queues" element={<AuthGuard requireAuth><Queues /></AuthGuard>} />
          <Route path="/channels" element={<AuthGuard requireAuth><Channels /></AuthGuard>} />
          <Route path="/payments" element={<AuthGuard requireAuth requiredRoles={['super_admin', 'tenant_admin']}><Payments /></AuthGuard>} />
          <Route path="/branding" element={<AuthGuard requireAuth requiredRoles={['tenant_admin']}><Branding /></AuthGuard>} />
          <Route path="/admin/tenants" element={<AuthGuard requireAuth requiredRoles={['super_admin']}><TenantManagement /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
