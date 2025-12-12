import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Key, Save, Shield, CreditCard, Mail, CheckCircle, XCircle, Info, Sparkles, Bot, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

interface Secret {
  name: string;
  value: string;
  label: string;
  description: string;
  required: boolean;
  category: 'payment' | 'email' | 'ai';
  isConfigured?: boolean;
}

export const PaymentSecretsTab = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  
  const [secrets, setSecrets] = useState<Secret[]>([
    // Gateway de Pagamentos
    {
      name: "STRIPE_WEBHOOK_SECRET",
      value: "",
      label: "Stripe Webhook Secret",
      description: "Secret para validação de webhooks do Stripe (começa com whsec_)",
      required: false,
      category: 'payment',
    },
    {
      name: "MERCADOPAGO_ACCESS_TOKEN",
      value: "",
      label: "Mercado Pago Access Token",
      description: "Token de acesso da API do Mercado Pago (Credenciais de Produção)",
      required: false,
      category: 'payment',
    },
    {
      name: "MERCADOPAGO_WEBHOOK_SECRET",
      value: "",
      label: "Mercado Pago Webhook Secret",
      description: "Secret para validação de webhooks do Mercado Pago",
      required: false,
      category: 'payment',
    },
    {
      name: "ASAAS_WEBHOOK_TOKEN",
      value: "",
      label: "ASAAS Webhook Token",
      description: "Token de verificação para webhooks do ASAAS",
      required: false,
      category: 'payment',
    },
    {
      name: "PAYPAL_WEBHOOK_ID",
      value: "",
      label: "PayPal Webhook ID",
      description: "ID do webhook configurado no PayPal Dashboard",
      required: false,
      category: 'payment',
    },
    // Serviços de Email
    {
      name: "RESEND_API_KEY",
      value: "",
      label: "Resend API Key",
      description: "Chave de API para envio de emails transacionais (crie conta em resend.com)",
      required: false,
      category: 'email',
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
            value: remoteSecret?.is_configured ? '••••••••••••' : '',
            isConfigured: remoteSecret?.is_configured || false,
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
        secret.name === name ? { ...secret, value, isConfigured: false } : secret
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

      if (error) {
        console.error("Error from edge function:", error);
        throw new Error(error.message || "Erro ao salvar secrets");
      }

      if (!data.success) {
        throw new Error(data.error || "Erro desconhecido ao salvar secrets");
      }

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

  const paymentSecrets = secrets.filter(s => s.category === 'payment');
  const emailSecrets = secrets.filter(s => s.category === 'email');
  const configuredCount = secrets.filter(s => s.isConfigured).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card de IA - Lovable AI */}
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            Lovable AI (Pré-configurado)
            <Badge className="ml-2 bg-green-500">Ativo</Badge>
          </CardTitle>
          <CardDescription>
            Inteligência Artificial já configurada e pronta para uso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>Não é necessária nenhuma configuração!</strong> O Lovable AI Gateway fornece acesso 
              aos modelos Google Gemini e OpenAI GPT automaticamente. A chave de API já está pré-configurada.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Gemini 2.5 Flash</Badge>
            <Badge variant="outline">Gemini Pro</Badge>
            <Badge variant="outline">GPT-5</Badge>
            <Badge variant="outline">GPT-5 Mini</Badge>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/admin/ai-config')}
          >
            <Bot className="mr-2 h-4 w-4" />
            Configurações Avançadas de IA
            <ExternalLink className="ml-auto h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Resumo de Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Status das Integrações</p>
                <p className="text-sm text-muted-foreground">
                  {configuredCount} de {secrets.length} chaves configuradas
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {configuredCount > 0 && (
                <Badge variant="outline" className="border-green-500 text-green-600">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {configuredCount} ativas
                </Badge>
              )}
              {secrets.length - configuredCount > 0 && (
                <Badge variant="outline" className="border-amber-500 text-amber-600">
                  <XCircle className="mr-1 h-3 w-3" />
                  {secrets.length - configuredCount} pendentes
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta de Segurança */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Segurança:</strong> Por motivos de segurança, secrets salvos não podem ser
          visualizados novamente. Você pode apenas atualizá-los inserindo novos valores.
        </AlertDescription>
      </Alert>

      {/* Gateway de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Gateways de Pagamento
          </CardTitle>
          <CardDescription>
            Configure as chaves de API para processar pagamentos via Stripe, Mercado Pago, ASAAS e PayPal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentSecrets.map((secret) => (
            <div key={secret.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={secret.name} className="flex items-center gap-2">
                  {secret.label}
                  {secret.isConfigured ? (
                    <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Configurado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Não configurado
                    </Badge>
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
        </CardContent>
      </Card>

      {/* Serviços de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-500" />
            Serviços de Email
          </CardTitle>
          <CardDescription>
            Configure chaves para envio de emails transacionais (notificações, faturas, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-500/5 border-blue-500/30">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription>
              <strong>O que é Resend?</strong> É um serviço de envio de emails transacionais. 
              Crie uma conta gratuita em{" "}
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">
                resend.com
              </a>
              {" "}para obter sua API Key.
            </AlertDescription>
          </Alert>

          {emailSecrets.map((secret) => (
            <div key={secret.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={secret.name} className="flex items-center gap-2">
                  {secret.label}
                  {secret.isConfigured ? (
                    <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Configurado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Não configurado
                    </Badge>
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
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Todas as Chaves
            </>
          )}
        </Button>
      </div>

      {/* Nota Final */}
      <Alert>
        <AlertDescription className="text-xs">
          <strong>Nota:</strong> Após configurar os secrets, certifique-se de configurar as URLs
          de webhook em cada plataforma (Stripe, Mercado Pago, ASAAS, PayPal) apontando para
          as edge functions correspondentes. As URLs aparecem nos cards de cada gateway na página de Pagamentos.
        </AlertDescription>
      </Alert>
    </div>
  );
};