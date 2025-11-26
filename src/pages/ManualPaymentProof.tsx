import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Check, FileText, Copy, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ManualPaymentConfig {
  pix_key?: string;
  pix_name?: string;
  payment_link?: string;
  notification_email?: string;
  instructions?: string;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  description: string;
  due_date: string;
}

export default function ManualPaymentProof() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceId = searchParams.get('invoice_id');
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<ManualPaymentConfig | null>(null);

  useEffect(() => {
    loadPaymentData();
  }, [invoiceId]);

  const loadPaymentData = async () => {
    try {
      if (!invoiceId) {
        toast.error('ID da fatura não encontrado');
        navigate('/invoices');
        return;
      }

      // Carregar dados da fatura
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Carregar configuração do gateway manual
      const { data: gatewayData, error: gatewayError } = await supabase
        .from('payment_gateways')
        .select('config')
        .eq('gateway_name', 'manual')
        .is('tenant_id', null)
        .eq('is_active', true)
        .single();

      if (gatewayError) throw gatewayError;
      if (gatewayData?.config) {
        setPaymentConfig(gatewayData.config as ManualPaymentConfig);
      }
    } catch (error: any) {
      console.error('Error loading payment data:', error);
      toast.error('Erro ao carregar dados de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Apenas imagens (JPG, PNG) ou PDF são aceitos');
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 5MB');
        return;
      }

      // Validate file name (prevent path traversal)
      if (selectedFile.name.includes('..') || selectedFile.name.includes('/') || selectedFile.name.includes('\\')) {
        toast.error('Nome de arquivo inválido');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file || !invoiceId) {
      toast.error('Selecione um arquivo');
      return;
    }

    try {
      setUploading(true);

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('Você precisa estar autenticado para enviar o comprovante');
        navigate('/auth');
        return;
      }

      // Get tenant_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', session.user.id)
        .single();

      if (!profile?.tenant_id) {
        toast.error('Tenant não encontrado. Entre em contato com o suporte.');
        return;
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${invoiceId}_${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${profile.tenant_id}/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('ticket-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('ticket-media')
        .getPublicUrl(filePath);

      // Send to webhook
      const { error: webhookError } = await supabase.functions.invoke('manual-payment-webhook', {
        body: {
          invoice_id: invoiceId,
          tenant_id: profile.tenant_id,
          proof_file_url: urlData.publicUrl
        }
      });

      if (webhookError) {
        console.error('Webhook error:', webhookError);
        throw new Error(webhookError.message || 'Erro ao processar comprovante');
      }

      setSubmitted(true);
      toast.success('Comprovante enviado com sucesso!');
      
      setTimeout(() => {
        navigate('/invoices');
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting proof:', error);
      toast.error('Erro ao enviar comprovante: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-900">
            Comprovante Enviado!
          </h1>
          <p className="text-muted-foreground">
            Seu comprovante foi enviado com sucesso e está aguardando aprovação.
            Você será notificado quando o pagamento for confirmado.
          </p>
          <Button onClick={() => navigate('/invoices')} className="w-full">
            Ver Minhas Faturas
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="max-w-2xl w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold">Pagamento Manual</h1>
          <p className="text-muted-foreground">
            Realize o pagamento e envie o comprovante
          </p>
        </div>

        {/* Informações da Fatura */}
        {invoice && (
          <Card className="bg-muted/50 border-2">
            <div className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="font-medium">{invoice.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: invoice.currency,
                    }).format(invoice.amount)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Dados de Pagamento */}
        {paymentConfig && (
          <Card className="bg-primary/5 border-primary/20">
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Dados para Pagamento</h3>
              
              {paymentConfig.instructions && (
                <div className="bg-background/50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-line">
                    {paymentConfig.instructions}
                  </p>
                </div>
              )}

              {paymentConfig.pix_key && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Chave PIX</Label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-background p-3 rounded-lg border text-sm break-all">
                      {paymentConfig.pix_key}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(paymentConfig.pix_key!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {paymentConfig.pix_name && (
                    <p className="text-sm text-muted-foreground">
                      Titular: <span className="font-medium">{paymentConfig.pix_name}</span>
                    </p>
                  )}
                </div>
              )}

              {paymentConfig.payment_link && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Link de Pagamento</Label>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open(paymentConfig.payment_link, "_blank")}
                  >
                    <span className="truncate">{paymentConfig.payment_link}</span>
                    <ExternalLink className="h-4 w-4 ml-2 flex-shrink-0" />
                  </Button>
                </div>
              )}

              {paymentConfig.notification_email && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="text-blue-900">
                    📧 Após realizar o pagamento, envie o comprovante através do formulário abaixo.
                    Nossa equipe receberá em: <span className="font-semibold">{paymentConfig.notification_email}</span>
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Formulário de Upload */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proof" className="text-base font-semibold">Enviar Comprovante</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-2 hover:border-primary transition-colors cursor-pointer">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="file-upload" className="cursor-pointer text-primary hover:underline">
                  Clique para selecionar o comprovante
                </Label>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou PDF (máx. 5MB)
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileChange}
              />
            </div>
            {file && (
              <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="flex-1 font-medium">{file.name}</span>
                <span className="text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 space-y-2">
            <p className="font-medium">⚠️ Importante:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>O comprovante será analisado pela nossa equipe</li>
              <li>Você receberá uma notificação após a aprovação</li>
              <li>Certifique-se de que os dados do pagamento estão visíveis no comprovante</li>
            </ul>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!file || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando Comprovante...
              </>
            ) : (
              'Enviar Comprovante'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
