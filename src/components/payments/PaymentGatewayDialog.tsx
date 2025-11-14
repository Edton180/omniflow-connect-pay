import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface PaymentGatewayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gateway: any;
  onSave: () => void;
}

// Validation schemas
const asaasSchema = z.object({
  api_key: z.string().min(1, "API Key é obrigatória").max(500),
});

const stripeSchema = z.object({
  secret_key: z.string().min(1, "Secret Key é obrigatória").max(500),
  publishable_key: z.string().min(1, "Publishable Key é obrigatória").max(500),
});

const mercadopagoSchema = z.object({
  access_token: z.string().min(1, "Access Token é obrigatório").max(500),
  public_key: z.string().min(1, "Public Key é obrigatória").max(500),
});

const infinitepaySchema = z.object({
  api_key: z.string().min(1, "API Key é obrigatória").max(500),
});

export function PaymentGatewayDialog({ open, onOpenChange, gateway, onSave }: PaymentGatewayDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [credentials, setCredentials] = useState<any>({});

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Validate credentials first
      let schema;
      switch (gateway.id) {
        case 'asaas':
          schema = asaasSchema;
          break;
        case 'stripe':
          schema = stripeSchema;
          break;
        case 'mercadopago':
          schema = mercadopagoSchema;
          break;
        case 'infinitepay':
          schema = infinitepaySchema;
          break;
        default:
          throw new Error('Gateway não suportado');
      }

      const validation = schema.safeParse(credentials);
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast({
          title: "Erro de validação",
          description: firstError.message,
          variant: "destructive",
        });
        setTesting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('test-gateway', {
        body: {
          gateway: gateway.id,
          credentials: credentials,
        },
      });

      if (error) throw error;

      setTestResult(data);

      if (data.success) {
        toast({
          title: "Teste bem-sucedido",
          description: data.message,
        });
      } else {
        toast({
          title: "Teste falhou",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Test error:', error);
      setTestResult({
        success: false,
        message: error.message || 'Erro ao testar conexão',
      });
      toast({
        title: "Erro ao testar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Validate credentials
      let schema;
      switch (gateway.id) {
        case 'asaas':
          schema = asaasSchema;
          break;
        case 'stripe':
          schema = stripeSchema;
          break;
        case 'mercadopago':
          schema = mercadopagoSchema;
          break;
        case 'infinitepay':
          schema = infinitepaySchema;
          break;
        default:
          throw new Error('Gateway não suportado');
      }

      const validation = schema.safeParse(credentials);
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast({
          title: "Erro de validação",
          description: firstError.message,
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if super admin
      const { data: isSuperAdmin } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      // Prepare gateway data
      const gatewayData: any = {
        gateway_name: gateway.id,
        is_active: true,
        config: credentials,
        tenant_id: isSuperAdmin ? null : undefined,
      };

      if (!isSuperAdmin) {
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("tenant_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!userRole?.tenant_id) {
          throw new Error('Tenant não encontrado');
        }
        gatewayData.tenant_id = userRole.tenant_id;
      }

      const { error } = await supabase
        .from("payment_gateways")
        .upsert(gatewayData, {
          onConflict: isSuperAdmin ? 'gateway_name' : 'gateway_name,tenant_id',
        });

      if (error) throw error;

      toast({
        title: "Gateway configurado",
        description: `${gateway.name} foi configurado com sucesso`,
      });

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderCredentialFields = () => {
    switch (gateway?.id) {
      case 'asaas':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key *</Label>
              <Input
                id="api_key"
                type="password"
                placeholder="$aact_..."
                value={credentials.api_key || ''}
                onChange={(e) => setCredentials({ ...credentials, api_key: e.target.value.trim() })}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                Encontre sua API Key no painel do ASAAS em Integrações → API Key
              </p>
            </div>
          </>
        );

      case 'stripe':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="secret_key">Secret Key *</Label>
              <Input
                id="secret_key"
                type="password"
                placeholder="sk_..."
                value={credentials.secret_key || ''}
                onChange={(e) => setCredentials({ ...credentials, secret_key: e.target.value.trim() })}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishable_key">Publishable Key *</Label>
              <Input
                id="publishable_key"
                type="text"
                placeholder="pk_..."
                value={credentials.publishable_key || ''}
                onChange={(e) => setCredentials({ ...credentials, publishable_key: e.target.value.trim() })}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                Encontre suas chaves no painel do Stripe em Developers → API keys
              </p>
            </div>
          </>
        );

      case 'mercadopago':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="access_token">Access Token *</Label>
              <Input
                id="access_token"
                type="password"
                placeholder="APP_USR-..."
                value={credentials.access_token || ''}
                onChange={(e) => setCredentials({ ...credentials, access_token: e.target.value.trim() })}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="public_key">Public Key *</Label>
              <Input
                id="public_key"
                type="text"
                placeholder="APP_USR-..."
                value={credentials.public_key || ''}
                onChange={(e) => setCredentials({ ...credentials, public_key: e.target.value.trim() })}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                Encontre suas credenciais no painel do Mercado Pago em Suas integrações → Credenciais
              </p>
            </div>
          </>
        );

      case 'infinitepay':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key *</Label>
              <Input
                id="api_key"
                type="password"
                placeholder="Digite sua API Key"
                value={credentials.api_key || ''}
                onChange={(e) => setCredentials({ ...credentials, api_key: e.target.value.trim() })}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                Encontre sua API Key no painel do InfinitePay
              </p>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar {gateway?.name}</DialogTitle>
          <DialogDescription>
            Configure as credenciais do gateway de pagamento
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="credentials" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credentials">Credenciais</TabsTrigger>
            <TabsTrigger value="docs">Documentação</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="space-y-4 mt-4">
            {renderCredentialFields()}

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="font-semibold">{testResult.message}</div>
                  {testResult.accountName && (
                    <div className="text-sm mt-1">Conta: {testResult.accountName}</div>
                  )}
                  {testResult.email && (
                    <div className="text-sm">Email: {testResult.email}</div>
                  )}
                  {testResult.environment && (
                    <div className="text-sm">Ambiente: {testResult.environment}</div>
                  )}
                  {testResult.details && (
                    <div className="text-sm mt-1 opacity-80">{testResult.details}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleTest}
                variant="outline"
                disabled={testing || saving}
                className="flex-1"
              >
                {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Testar Conexão
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || testing}
                className="flex-1"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Configuração
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="docs" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Links úteis:</div>
                {gateway?.id === 'asaas' && (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><a href="https://docs.asaas.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Documentação oficial</a></li>
                    <li><a href="https://www.asaas.com/painel/integracoes" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Obter API Key</a></li>
                  </ul>
                )}
                {gateway?.id === 'stripe' && (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><a href="https://stripe.com/docs/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Documentação oficial</a></li>
                    <li><a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Obter API Keys</a></li>
                  </ul>
                )}
                {gateway?.id === 'mercadopago' && (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Documentação oficial</a></li>
                    <li><a href="https://www.mercadopago.com.br/developers/panel/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Obter credenciais</a></li>
                  </ul>
                )}
                {gateway?.id === 'infinitepay' && (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><a href="https://docs.infinitepay.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Documentação oficial</a></li>
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
