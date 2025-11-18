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

export default function PaymentRequired() {
  const navigate = useNavigate();
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
      console.log("💳 Iniciando processo de pagamento para fatura:", invoiceId);

      // VERIFICAÇÃO: Buscar gateway global ativo antes de tentar iniciar checkout
      console.log("🔍 [Step 1] Verificando gateways globais ativos...");
      console.log("  - Critério: is_active = true AND tenant_id IS NULL");
      
      const { data: gateways, error: gatewayError, count } = await supabase
        .from("payment_gateways")
        .select("*", { count: 'exact' })
        .eq("is_active", true)
        .is("tenant_id", null); // Apenas gateways globais

      console.log("📊 [Step 2] Resultado da busca de gateways:");
      console.log("  - Total de gateways (ativos e globais):", count);
      console.log("  - Gateways retornados:", gateways?.length || 0);
      console.log("  - Erro na query:", gatewayError);
      
      if (gateways && gateways.length > 0) {
        console.log("  ✅ Gateway(s) encontrado(s):");
        gateways.forEach((gw: any, idx: number) => {
          console.log(`    ${idx + 1}. ${gw.gateway_name}`);
          console.log(`       - ID: ${gw.id}`);
          console.log(`       - tenant_id: ${gw.tenant_id}`);
          console.log(`       - is_active: ${gw.is_active}`);
          console.log(`       - Credenciais: ${gw.api_key_encrypted ? 'Configuradas' : 'Não configuradas'}`);
        });
      } else {
        console.log("  ⚠️ Nenhum gateway encontrado com os critérios");
      }
      
      if (gatewayError) {
        console.error("❌ [Error] Erro ao buscar gateways:", gatewayError);
        toast.error("Erro ao verificar gateways de pagamento: " + gatewayError.message);
        return;
      }

      if (!gateways || gateways.length === 0) {
        console.error("❌ [Error] Nenhum gateway global configurado");
        console.error("💡 Verificações necessárias:");
        console.error("  1. Existe gateway na tabela payment_gateways?");
        console.error("  2. O gateway tem is_active = true?");
        console.error("  3. O gateway tem tenant_id = NULL (global)?");
        console.error("  4. O gateway tem credenciais configuradas?");
        toast.error(
          "Nenhum gateway de pagamento configurado",
          {
            description: "Por favor, acesse Configurações > Pagamentos e configure um gateway global.",
            duration: 6000,
          }
        );
        return;
      }

      console.log("✅ [Step 3] Gateway válido encontrado:", gateways[0].gateway_name);
      console.log("🚀 [Step 4] Iniciando checkout via edge function init-checkout...");
      console.log("  - Invoice ID:", invoiceId);
      console.log("  - Gateway selecionado:", gateways[0].gateway_name);

      const { data, error } = await supabase.functions.invoke("init-checkout", {
        body: {
          invoiceId: invoiceId,
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

      if (!data?.checkout_url) {
        console.error("❌ [Error] URL de checkout não retornada");
        console.error("  - Data recebido:", data);
        throw new Error("URL de checkout não foi gerada. Verifique a configuração do gateway.");
      }

      console.log("✅ [Step 6] Checkout iniciado com sucesso!");
      console.log("  - Gateway:", data.gateway);
      console.log("  - URL:", data.checkout_url);
      
      setCheckoutData(data);
      setCheckoutDialogOpen(true);
    } catch (error: any) {
      console.error("❌ [Fatal Error] Error initiating payment:", error);
      toast.error(error.message || "Erro ao iniciar pagamento");
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
