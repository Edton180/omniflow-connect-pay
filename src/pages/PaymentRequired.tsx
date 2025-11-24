import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, CreditCard, Loader2, Copy, LogOut } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function PaymentRequired() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [availableGateways, setAvailableGateways] = useState<any[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [gatewaySelectionDialogOpen, setGatewaySelectionDialogOpen] = useState(false);
  const [pendingInvoiceId, setPendingInvoiceId] = useState<string | null>(null);

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
    try {
      console.log("💳 Iniciando processo de pagamento para fatura:", invoiceId);

      // Buscar gateways globais ativos
      const { data: gateways, error: gatewayError } = await supabase
        .from("payment_gateways")
        .select("*")
        .eq("is_active", true)
        .is("tenant_id", null);
      
      if (gatewayError) {
        console.error("❌ Erro ao buscar gateways:", gatewayError);
        toast.error("Erro ao verificar gateways de pagamento");
        return;
      }

      if (!gateways || gateways.length === 0) {
        toast.error("Nenhum gateway de pagamento configurado");
        return;
      }

      setAvailableGateways(gateways);
      
      // Se há apenas 1 gateway, usar diretamente
      if (gateways.length === 1) {
        await processPayment(invoiceId, gateways[0].gateway_name);
      } else {
        // Se há múltiplos gateways, mostrar seleção
        setPendingInvoiceId(invoiceId);
        setSelectedGateway(gateways[0].gateway_name);
        setGatewaySelectionDialogOpen(true);
      }
    } catch (error: any) {
      console.error("❌ Erro ao iniciar pagamento:", error);
      toast.error(error.message || "Erro ao iniciar pagamento");
    }
  };

  const processPayment = async (invoiceId: string, gatewayName: string) => {
    setProcessingId(invoiceId);
    setGatewaySelectionDialogOpen(false);
    
    try {
      // Validações básicas
      if (!invoiceId || typeof invoiceId !== 'string') {
        throw new Error("ID da fatura inválido");
      }

      if (!gatewayName || typeof gatewayName !== 'string') {
        throw new Error("Gateway de pagamento não selecionado");
      }

      console.log("🚀 Processando pagamento...");
      console.log("  - Invoice ID:", invoiceId);
      console.log("  - Gateway:", gatewayName);

      // Para pagamento manual, redirecionar para página de envio de comprovante
      if (gatewayName === "manual") {
        toast.success("Redirecionando para envio de comprovante...");
        navigate("/manual-payment-proof");
        return;
      }

      const { data, error } = await supabase.functions.invoke("init-checkout", {
        body: {
          invoiceId: invoiceId,
          gateway: gatewayName,
        },
      });

      console.log("📬 [Step 5] Resposta do init-checkout:");
      console.log("  - Success:", !!data);
      console.log("  - Error:", error);

      if (error) {
        console.error("❌ [Error] Erro ao iniciar checkout:", error);
        throw new Error(error.message || "Erro ao iniciar checkout");
      }

      if (data?.error) {
        console.error("❌ [Error] Erro retornado pelo init-checkout:", data.error);
        throw new Error(data.error);
      }

      if (!data?.checkout_url && !data?.qr_code) {
        console.error("❌ [Error] Nenhum método de pagamento retornado");
        console.error("  - Data recebido:", data);
        throw new Error("Método de pagamento não foi gerado. Verifique a configuração do gateway.");
      }

      console.log("✅ [Step 6] Checkout iniciado com sucesso!");
      console.log("  - Gateway:", data.gateway);
      console.log("  - URL:", data.checkout_url ? "Presente" : "Não presente");
      console.log("  - QR Code:", data.qr_code ? "Presente" : "Não presente");
      
      setCheckoutData(data);
      setCheckoutDialogOpen(true);
      toast.success("Checkout gerado com sucesso!");
    } catch (error: any) {
      console.error("❌ [Fatal Error] Error initiating payment:", error);
      
      // Melhorar mensagem de erro para o usuário
      let userMessage = error.message || "Erro ao iniciar pagamento";
      
      if (userMessage.includes("API Key")) {
        userMessage = "Erro de configuração do gateway. Contate o administrador.";
      } else if (userMessage.includes("conexão") || userMessage.includes("fetch")) {
        userMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
      }
      
      toast.error(userMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para área de transferência!");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-destructive">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <CardTitle className="text-2xl">Pagamento Necessário</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Sua assinatura está vencida. Pague as faturas pendentes para restaurar o acesso.
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
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

      {/* Dialog de Seleção de Gateway */}
      <Dialog open={gatewaySelectionDialogOpen} onOpenChange={setGatewaySelectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecione o Método de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Gateway de Pagamento</Label>
              <Select value={selectedGateway} onValueChange={setSelectedGateway}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um gateway" />
                </SelectTrigger>
                <SelectContent>
                  {availableGateways.map((gateway) => (
                    <SelectItem key={gateway.id} value={gateway.gateway_name}>
                      {gateway.gateway_name === "asaas" && "ASAAS"}
                      {gateway.gateway_name === "stripe" && "Stripe"}
                      {gateway.gateway_name === "mercadopago" && "Mercado Pago"}
                      {gateway.gateway_name === "paypal" && "PayPal"}
                      {gateway.gateway_name === "infinitepay" && "InfinitePay"}
                      {gateway.gateway_name === "manual" && "Pagamento Manual"}
                      {!["asaas", "stripe", "mercadopago", "paypal", "infinitepay", "manual"].includes(gateway.gateway_name) && gateway.gateway_name.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full" 
              onClick={() => pendingInvoiceId && processPayment(pendingInvoiceId, selectedGateway)}
              disabled={!selectedGateway}
            >
              Continuar com {selectedGateway}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Checkout */}
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
                  {checkoutData.checkout_url && (
                    <img 
                      src={checkoutData.checkout_url.startsWith('data:') ? checkoutData.checkout_url : `data:image/png;base64,${checkoutData.checkout_url}`} 
                      alt="QR Code PIX" 
                      className="mx-auto max-w-xs border-2 border-border rounded-lg p-2 bg-white" 
                    />
                  )}
                  <p className="text-xs mt-4 font-medium">Ou copie o código PIX abaixo:</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-muted p-3 rounded block flex-1 break-all max-h-32 overflow-y-auto">
                      {checkoutData.qr_code}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(checkoutData.qr_code)}
                      title="Copiar código PIX"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Este código PIX é válido por 48 horas
                  </p>
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
