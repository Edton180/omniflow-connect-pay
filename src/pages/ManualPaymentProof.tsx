import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ManualPaymentProof() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceId = searchParams.get('invoice_id');
  
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get tenant_id
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!userRole?.tenant_id) throw new Error('Tenant não encontrado');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${invoiceId}_${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${userRole.tenant_id}/${fileName}`;

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
          tenant_id: userRole.tenant_id,
          proof_file_url: urlData.publicUrl
        }
      });

      if (webhookError) throw webhookError;

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
      <Card className="max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold">Enviar Comprovante</h1>
          <p className="text-muted-foreground">
            Envie o comprovante do pagamento realizado
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proof">Comprovante de Pagamento</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-2 hover:border-primary transition-colors">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="file-upload" className="cursor-pointer text-primary hover:underline">
                  Clique para selecionar
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
              <div className="text-sm text-muted-foreground bg-green-50 p-2 rounded border border-green-200">
                ✓ {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 space-y-2">
            <p className="font-medium">Importante:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>O comprovante será analisado pela equipe</li>
              <li>Você receberá uma notificação após a aprovação</li>
              <li>Certifique-se de que os dados do pagamento estão visíveis</li>
            </ul>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!file || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? 'Enviando...' : 'Enviar Comprovante'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
