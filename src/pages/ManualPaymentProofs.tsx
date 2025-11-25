import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Check, X, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Invoice {
  id: string;
  tenant_id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  proof_file_url: string | null;
  proof_submitted_at: string | null;
  created_at: string;
  tenants: {
    name: string;
  };
}

export default function ManualPaymentProofs() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPendingProofs();
  }, []);

  const loadPendingProofs = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          tenants (
            name
          )
        `)
        .eq("status", "pending_verification")
        .not("proof_file_url", "is", null)
        .order("proof_submitted_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error loading proofs:", error);
      toast.error("Erro ao carregar comprovantes");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (invoice: Invoice) => {
    try {
      setProcessing(invoice.id);
      
      // Process payment
      const { data, error } = await supabase.functions.invoke("process-invoice-payment", {
        body: {
          invoice_id: invoice.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Pagamento aprovado com sucesso!");
      setPreviewOpen(false);
      loadPendingProofs();
    } catch (error: any) {
      console.error("Error approving payment:", error);
      toast.error("Erro ao aprovar pagamento: " + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (invoice: Invoice) => {
    try {
      setProcessing(invoice.id);

      const { error } = await supabase
        .from("invoices")
        .update({
          status: "pending",
          proof_file_url: null,
          proof_submitted_at: null,
        })
        .eq("id", invoice.id);

      if (error) throw error;

      toast.success("Comprovante rejeitado. Cliente precisará reenviar.");
      setPreviewOpen(false);
      loadPendingProofs();
    } catch (error: any) {
      console.error("Error rejecting proof:", error);
      toast.error("Erro ao rejeitar comprovante: " + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const openPreview = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comprovantes de Pagamento</h1>
        <p className="text-muted-foreground">
          Analise e aprove os comprovantes de pagamento manual enviados pelos clientes
        </p>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum comprovante pendente de aprovação
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{invoice.tenants.name}</h3>
                      <Badge variant="outline">{invoice.description}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enviado em:{" "}
                      {invoice.proof_submitted_at &&
                        format(new Date(invoice.proof_submitted_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                    </p>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: invoice.currency,
                      }).format(invoice.amount)}
                    </p>
                  </div>
                  <Button onClick={() => openPreview(invoice)} variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Comprovante
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Preview do Comprovante */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Análise de Comprovante</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedInvoice.tenants.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: selectedInvoice.currency,
                    }).format(selectedInvoice.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Descrição</p>
                  <p className="font-medium">{selectedInvoice.description}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data de Envio</p>
                  <p className="font-medium">
                    {selectedInvoice.proof_submitted_at &&
                      format(
                        new Date(selectedInvoice.proof_submitted_at),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                  </p>
                </div>
              </div>

              {selectedInvoice.proof_file_url && (
                <div className="border rounded-lg overflow-hidden">
                  {selectedInvoice.proof_file_url.endsWith(".pdf") ? (
                    <div className="text-center p-8 space-y-4">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Arquivo PDF</p>
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedInvoice.proof_file_url!, "_blank")}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir PDF
                      </Button>
                    </div>
                  ) : (
                    <img
                      src={selectedInvoice.proof_file_url}
                      alt="Comprovante"
                      className="w-full h-auto"
                    />
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleReject(selectedInvoice!)}
              disabled={processing === selectedInvoice?.id}
            >
              <X className="mr-2 h-4 w-4" />
              Rejeitar
            </Button>
            <Button
              onClick={() => handleApprove(selectedInvoice!)}
              disabled={processing === selectedInvoice?.id}
            >
              {processing === selectedInvoice?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Aprovar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
