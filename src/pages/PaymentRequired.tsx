import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, CreditCard, Loader2, Copy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PaymentRequired() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!userRole?.tenant_id) return;

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("tenant_id", userRole.tenant_id)
        .in("status", ["pending", "overdue"])
        .order("due_date", { ascending: true });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast.error("Erro ao carregar faturas");
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    setProcessingId(invoiceId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user!.id)
        .single();

      // Buscar gateway ativo do tenant ou gateway global (tenant_id NULL)
      const { data: gateways } = await supabase
        .from("payment_gateways")
        .select("gateway_name")
        .eq("is_active", true)
        .or(`tenant_id.eq.${userRole!.tenant_id},tenant_id.is.null`)
        .order("tenant_id", { ascending: false }) // Prioriza tenant específico sobre global
        .limit(1);

      if (!gateways || gateways.length === 0) {
        toast.error("Nenhum gateway de pagamento configurado. Configure um gateway em /payments");
        return;
      }
      
      const gateway = gateways[0];

      const { data, error } = await supabase.functions.invoke("init-checkout", {
        body: {
          invoice_id: invoiceId,
          gateway_name: gateway.gateway_name,
        },
      });

      if (error) throw error;

      setCheckoutData(data);
      setCheckoutDialogOpen(true);
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      toast.error(error.message || "Erro ao iniciar pagamento");
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para área de transferência!");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-destructive">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-2xl">Pagamento Necessário</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Sua assinatura está vencida. Pague as faturas pendentes para restaurar o acesso.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma fatura pendente encontrada. Aguarde processamento.
            </p>
          ) : (
            invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold">{invoice.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {invoice.status === "overdue" ? "Vencida" : "Pendente"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: invoice.currency,
                      }).format(parseFloat(invoice.amount))}
                    </p>
                    <Button
                      onClick={() => handlePayInvoice(invoice.id)}
                      disabled={processingId === invoice.id}
                    >
                      {processingId === invoice.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pagar Agora
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete o Pagamento</DialogTitle>
          </DialogHeader>
          {checkoutData && (
            <div className="space-y-4">
              {checkoutData.qr_code && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Escaneie o QR Code PIX:</p>
                  <img src={checkoutData.checkout_url} alt="QR Code PIX" className="mx-auto max-w-xs" />
                  <p className="text-xs mt-2">Ou copie o código abaixo:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted p-2 rounded block flex-1 break-all">
                      {checkoutData.qr_code}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(checkoutData.qr_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {checkoutData.checkout_url && !checkoutData.qr_code && (
                <Button
                  className="w-full"
                  onClick={() => window.open(checkoutData.checkout_url, "_blank")}
                >
                  Ir para Pagamento
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
