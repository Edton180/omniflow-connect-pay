import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Key, Save, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Secret {
  name: string;
  value: string;
  label: string;
  description: string;
  required: boolean;
}

export const PaymentSecretsTab = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  
  const [secrets, setSecrets] = useState<Secret[]>([
    {
      name: "RESEND_API_KEY",
      value: "",
      label: "Resend API Key",
      description: "Chave de API para envio de emails via Resend (crie conta em resend.com)",
      required: false,
    },
    {
      name: "ASAAS_WEBHOOK_TOKEN",
      value: "",
      label: "ASAAS Webhook Token",
      description: "Token de verificação para webhooks do ASAAS",
      required: false,
    },
    {
      name: "MERCADOPAGO_WEBHOOK_SECRET",
      value: "",
      label: "Mercado Pago Webhook Secret",
      description: "Secret para validação de webhooks do Mercado Pago",
      required: false,
    },
    {
      name: "MERCADOPAGO_ACCESS_TOKEN",
      value: "",
      label: "Mercado Pago Access Token",
      description: "Token de acesso da API do Mercado Pago",
      required: false,
    },
    {
      name: "INFINITEPAY_WEBHOOK_SECRET",
      value: "",
      label: "InfinitePay Webhook Secret",
      description: "Secret para validação de webhooks do InfinitePay",
      required: false,
    },
    {
      name: "STRIPE_WEBHOOK_SECRET",
      value: "",
      label: "Stripe Webhook Secret",
      description: "Secret para validação de webhooks do Stripe",
      required: false,
    },
  ]);

  useEffect(() => {
    loadSecrets();
  }, []);

  const loadSecrets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-system-secrets');
      
      if (error) throw error;

      // Atualizar status dos secrets (se estão configurados ou não)
      if (data?.secrets) {
        setSecrets(prev => prev.map(secret => {
          const remoteSecret = data.secrets.find((s: any) => s.secret_name === secret.name);
          return {
            ...secret,
            // Não exibir o valor por segurança, apenas indicar se está configurado
            value: remoteSecret?.is_configured ? '••••••••••••' : '',
          };
        }));
      }
    } catch (error: any) {
      console.error("Error loading secrets:", error);
      toast.error(error.message || "Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSecretChange = (name: string, value: string) => {
    setSecrets(prev =>
      prev.map(secret =>
        secret.name === name ? { ...secret, value } : secret
      )
    );
  };

  const toggleShowSecret = (name: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filtrar apenas secrets que foram modificados (não são ••••)
      const secretsToSave = secrets
        .filter(s => s.value.trim() !== "" && !s.value.startsWith("•"))
        .map(s => ({
          name: s.name,
          value: s.value,
        }));

      if (secretsToSave.length === 0) {
        toast.warning("Nenhum secret foi modificado");
        return;
      }

      const { data, error } = await supabase.functions.invoke('save-system-secrets', {
        body: { secrets: secretsToSave },
      });

      if (error) throw error;

      toast.success(data.message || `${secretsToSave.length} secret(s) salvos com sucesso`);

      // Recarregar secrets
      await loadSecrets();
    } catch (error: any) {
      console.error("Error saving secrets:", error);
      toast.error(error.message || "Erro ao salvar secrets");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Segurança:</strong> Por motivos de segurança, secrets salvos não podem ser
          visualizados novamente. Você pode apenas atualizá-los inserindo novos valores.
          <br /><br />
          <strong>O que é Resend?</strong> Resend é um serviço de envio de emails transacionais 
          (notificações automáticas). Você pode criar uma conta gratuita em{" "}
          <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            resend.com
          </a>
          {" "}e obter sua API Key. É necessário para enviar emails de notificação de faturas.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuração de Secrets
          </CardTitle>
          <CardDescription>
            Configure as chaves de API e secrets necessários para integração com gateways de
            pagamento e serviços externos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {secrets.map((secret) => (
            <div key={secret.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={secret.name} className="flex items-center gap-2">
                  {secret.label}
                  {secret.required && (
                    <span className="text-xs text-destructive">*obrigatório</span>
                  )}
                </Label>
              </div>
              
              <p className="text-sm text-muted-foreground">{secret.description}</p>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={secret.name}
                    type={showSecrets[secret.name] ? "text" : "password"}
                    value={secret.value}
                    onChange={(e) => handleSecretChange(secret.name, e.target.value)}
                    placeholder={`Digite o ${secret.label.toLowerCase()}`}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => toggleShowSecret(secret.name)}
                  >
                    {showSecrets[secret.name] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Secrets
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription className="text-xs">
          <strong>Nota:</strong> Após configurar os secrets, certifique-se de configurar as URLs
          de webhook em cada plataforma (ASAAS, Stripe, Mercado Pago, InfinitePay) apontando para
          as edge functions correspondentes. As URLs aparecem nos cards de cada gateway.
        </AlertDescription>
      </Alert>
    </div>
  );
};