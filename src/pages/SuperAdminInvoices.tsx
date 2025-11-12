import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, FileText, Loader2, DollarSign, Calendar, Building2, Search, Plus, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";

export default function SuperAdminInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [generatingCheckout, setGeneratingCheckout] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select(`
          *,
          tenant:tenants(id, name, slug),
          subscription:subscriptions(id, plan:plans(name, billing_period))
        `)
        .order("created_at", { ascending: false });

      if (invoicesError) throw invoicesError;

      setInvoices(invoicesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (invoiceId: string) => {
    setProcessingId(invoiceId);
    try {
      const { data, error } = await supabase.functions.invoke("process-invoice-payment", {
        body: { invoiceId },
      });

      if (error) throw error;

      toast.success("Pagamento processado com sucesso!");
      loadData();
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerateCheckout = async (invoiceId: string) => {
    setGeneratingCheckout(invoiceId);
    try {
      const { data, error } = await supabase.functions.invoke("init-checkout", {
        body: { invoiceId },
      });

      if (error) throw error;

      if (data.checkout_url) {
        window.open(data.checkout_url, "_blank");
        toast.success("Checkout gerado! Abrindo página de pagamento...");
      } else if (data.qr_code) {
        toast.success("PIX gerado! QR Code disponível.");
      }
    } catch (error: any) {
      console.error("Error generating checkout:", error);
      toast.error(error.message || "Erro ao gerar checkout");
    } finally {
      setGeneratingCheckout(null);
    }
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
      currency: currency || "BRL",
    }).format(amount);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const tenantName = invoice.tenant?.name?.toLowerCase() || "";
    const searchLower = search.toLowerCase();
    return tenantName.includes(searchLower);
  });

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
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white shadow-glow">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Faturas - Super Admin</h1>
              <p className="text-xs text-muted-foreground">Gerencie todas as faturas do sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Fatura
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredInvoices.map((invoice) => {
              const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status === "pending";
              
              return (
                <Card key={invoice.id} className={isOverdue ? "border-destructive" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {invoice.tenant?.name || "Empresa não encontrada"}
                        </CardTitle>
                        <CardDescription>
                          {invoice.description || "Fatura de Assinatura"}
                        </CardDescription>
                        <div className="text-xs text-muted-foreground">
                          Criada em {format(new Date(invoice.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
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
                          <p className={`font-semibold ${isOverdue ? "text-destructive" : ""}`}>
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

                    {invoice.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleGenerateCheckout(invoice.id)}
                          disabled={generatingCheckout === invoice.id}
                          size="sm"
                        >
                          {generatingCheckout === invoice.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Gerar Checkout
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleProcessPayment(invoice.id)}
                          disabled={processingId === invoice.id}
                          variant="outline"
                          size="sm"
                        >
                          {processingId === invoice.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            "Marcar como Paga"
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CreateInvoiceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadData}
      />
    </div>
  );
}