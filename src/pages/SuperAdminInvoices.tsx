import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Calendar, DollarSign, AlertCircle, ArrowLeft, LogOut } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  paid_at: string | null;
  description: string | null;
  created_at: string;
  tenant_id: string;
  tenants?: {
    name: string;
    slug: string;
  };
}

const SuperAdminInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const { data: invoicesData, error } = await supabase
        .from("invoices")
        .select("*")
        .order("due_date", { ascending: false });

      if (error) throw error;

      // Buscar informações dos tenants separadamente
      const tenantIds = [...new Set(invoicesData?.map(inv => inv.tenant_id) || [])];
      const { data: tenantsData } = await supabase
        .from("tenants")
        .select("id, name, slug")
        .in("id", tenantIds);

      // Combinar os dados
      const invoicesWithTenants = (invoicesData || []).map(invoice => ({
        ...invoice,
        tenants: tenantsData?.find(t => t.id === invoice.tenant_id)
      }));

      setInvoices(invoicesWithTenants as any);
    } catch (error) {
      console.error("Erro ao carregar faturas:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar faturas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === "pending";
    
    if (isOverdue) {
      return <Badge variant="destructive">Vencida</Badge>;
    }

    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paga</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
  const overdueInvoices = pendingInvoices.filter(inv => new Date(inv.due_date) < new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/tenants")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Faturas - Super Admin</h1>
              <p className="text-xs text-muted-foreground">Gerencie todas as faturas do sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Faturas Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvoices.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-destructive">Faturas Vencidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overdueInvoices.length}</div>
            </CardContent>
          </Card>
        </div>

        {invoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invoices.map((invoice) => {
              const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status === "pending";
              const daysUntilDue = getDaysUntilDue(invoice.due_date);
              const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0 && invoice.status === "pending";
              
              return (
                <Card key={invoice.id} className={isOverdue ? "border-destructive" : isDueSoon ? "border-yellow-500" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {invoice.description || "Fatura de Assinatura"}
                        </CardTitle>
                        <CardDescription>
                          {invoice.tenants?.name || 'Empresa'} • Criada em {format(new Date(invoice.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </CardDescription>
                      </div>
                      {getStatusBadge(invoice.status, invoice.due_date)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Valor</p>
                          <p className="font-semibold">
                            {formatCurrency(Number(invoice.amount), invoice.currency)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Vencimento</p>
                          <p className={`font-semibold ${isOverdue ? "text-destructive" : isDueSoon ? "text-yellow-600" : ""}`}>
                            {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      {invoice.paid_at && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Pago em</p>
                            <p className="font-semibold text-green-600">
                              {format(new Date(invoice.paid_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {isOverdue && (
                      <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm font-semibold">Esta fatura está vencida há {Math.abs(daysUntilDue)} dia(s)</p>
                      </div>
                    )}

                    {isDueSoon && !isOverdue && (
                      <div className="flex items-center gap-2 text-yellow-600 bg-yellow-500/10 p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm font-semibold">Vence em {daysUntilDue} dia(s)</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminInvoices;
