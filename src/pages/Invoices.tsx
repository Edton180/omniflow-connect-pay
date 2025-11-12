import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Calendar, DollarSign, AlertCircle, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  paid_at: string | null;
  description: string | null;
  subscription_id: string | null;
  created_at: string;
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [generatingCheckout, setGeneratingCheckout] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.tenant_id) {
        toast({
          title: "Erro",
          description: "Tenant não encontrado",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("due_date", { ascending: false });

      if (error) throw error;
      
      // Verificar faturas vencidas e próximas do vencimento
      const now = new Date();
      const invoicesData = data || [];
      
      invoicesData.forEach(invoice => {
        const dueDate = new Date(invoice.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (invoice.status === 'pending') {
          if (daysUntilDue < 0) {
            // Vencida
            toast({
              title: "Fatura Vencida",
              description: `Fatura de ${formatCurrency(Number(invoice.amount), invoice.currency)} está vencida`,
              variant: "destructive",
            });
          } else if (daysUntilDue <= 3 && daysUntilDue >= 0) {
            // Próxima do vencimento
            toast({
              title: "Fatura a Vencer",
              description: `Fatura de ${formatCurrency(Number(invoice.amount), invoice.currency)} vence em ${daysUntilDue} dia(s)`,
            });
          }
        }
      });
      
      setInvoices(invoicesData);
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

  const handlePayment = async (invoiceId: string) => {
    setProcessingPayment(invoiceId);
    try {
      const { data, error } = await supabase.functions.invoke("process-invoice-payment", {
        body: { invoiceId },
      });

      if (error) throw error;

      toast({
        title: "Pagamento processado",
        description: data.message || "Fatura paga com sucesso!",
      });

      loadInvoices();
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(null);
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
        toast({
          title: "Checkout gerado",
          description: "Redirecionando para página de pagamento...",
        });
      } else if (data.qr_code) {
        toast({
          title: "PIX gerado",
          description: "Escaneie o QR Code para pagar",
        });
      }
    } catch (error: any) {
      console.error("Erro ao gerar checkout:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar checkout",
        variant: "destructive",
      });
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
      currency: currency,
    }).format(amount);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Faturas</h1>
          <p className="text-muted-foreground">
            Gerencie suas faturas e pagamentos
          </p>
        </div>
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
                        Criada em {format(new Date(invoice.created_at), "dd/MM/yyyy", { locale: ptBR })}
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

                  {invoice.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleGenerateCheckout(invoice.id)}
                        disabled={generatingCheckout === invoice.id}
                        className="flex-1"
                        variant="default"
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
                        onClick={() => handlePayment(invoice.id)}
                        disabled={processingPayment === invoice.id}
                        variant="outline"
                        className="flex-1"
                      >
                        {processingPayment === invoice.id ? (
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
  );
};

export default Invoices;