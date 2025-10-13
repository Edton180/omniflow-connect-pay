import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentGatewayCard } from "./PaymentGatewayCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const PaymentGatewayList = () => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<any>(null);
  const [connectedGateways, setConnectedGateways] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const baseGateways = [
    {
      id: "asaas",
      name: "ASAAS",
      description: "Pagamentos via Pix, Boleto e Cartão",
    },
    {
      id: "mercadopago",
      name: "Mercado Pago",
      description: "Gateway completo de pagamentos",
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Pagamentos internacionais",
    },
    {
      id: "infinitepay",
      name: "InfinitePay",
      description: "Soluções de pagamento digital",
    },
  ];

  const gateways = baseGateways.map(gateway => ({
    ...gateway,
    connected: connectedGateways.has(gateway.id)
  }));

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!userRole?.tenant_id) return;

      const { data: savedGateways } = await supabase
        .from("payment_gateways")
        .select("gateway_name, is_active")
        .eq("tenant_id", userRole.tenant_id)
        .eq("is_active", true);

      if (savedGateways) {
        setConnectedGateways(new Set(savedGateways.map(g => g.gateway_name)));
      }
    } catch (error) {
      console.error("Error loading gateways:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = (gateway: any) => {
    setSelectedGateway(gateway);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError || !userRole?.tenant_id) {
        toast({
          title: "Erro",
          description: "Tenant não encontrado. Entre em contato com o administrador.",
          variant: "destructive",
        });
        return;
      }

      // Get form values
      const apiKey = (document.getElementById(`${selectedGateway.id}_api_key`) as HTMLInputElement)?.value;
      const config: Record<string, any> = {};

      if (selectedGateway.id === "asaas") {
        config.api_key = apiKey;
        config.wallet_id = (document.getElementById("asaas_wallet_id") as HTMLInputElement)?.value;
      } else if (selectedGateway.id === "mercadopago") {
        config.public_key = (document.getElementById("mp_public_key") as HTMLInputElement)?.value;
        config.access_token = (document.getElementById("mp_access_token") as HTMLInputElement)?.value;
      } else if (selectedGateway.id === "stripe") {
        config.public_key = (document.getElementById("stripe_public_key") as HTMLInputElement)?.value;
        config.secret_key = (document.getElementById("stripe_secret_key") as HTMLInputElement)?.value;
      } else if (selectedGateway.id === "infinitepay") {
        config.api_key = apiKey;
      }

      const { error } = await supabase.from("payment_gateways").upsert({
        tenant_id: userRole.tenant_id,
        gateway_name: selectedGateway.id,
        api_key_encrypted: apiKey,
        config: config,
        is_active: true,
      }, {
        onConflict: "tenant_id,gateway_name",
      });

      if (error) throw error;

      toast({
        title: "Configuração salva",
        description: `Gateway ${selectedGateway?.name} configurado com sucesso.`,
      });
      setDialogOpen(false);
      await loadGateways();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure seus gateways de pagamento para começar a processar transações. 
          Você precisará das credenciais API de cada serviço.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {gateways.map((gateway) => (
          <PaymentGatewayCard
            key={gateway.id}
            gateway={gateway}
            onConfigure={() => handleConfigure(gateway)}
          />
        ))}
      </div>

      <Card className="gradient-card">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Aceite pagamentos de múltiplas formas</h3>
            <p className="text-sm text-muted-foreground">
              Integre com os principais gateways de pagamento do Brasil e ofereça Pix, 
              boleto, cartão de crédito e débito para seus clientes.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar {selectedGateway?.name}</DialogTitle>
            <DialogDescription>
              Insira suas credenciais da API para conectar o gateway
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credentials">Credenciais</TabsTrigger>
              <TabsTrigger value="docs">Documentação</TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="space-y-4 pt-4">
              {selectedGateway?.id === "asaas" && (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Obtenha sua API Key no painel do ASAAS em: Configurações → Integrações → API Key
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="asaas_api_key">API Key</Label>
                    <Input
                      id="asaas_api_key"
                      placeholder="$aact_..."
                      type="password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asaas_wallet_id">Wallet ID (opcional)</Label>
                    <Input
                      id="asaas_wallet_id"
                      placeholder="wallet_..."
                    />
                  </div>
                </>
              )}

              {selectedGateway?.id === "mercadopago" && (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Crie suas credenciais no Mercado Pago Developers
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="mp_public_key">Public Key</Label>
                    <Input
                      id="mp_public_key"
                      placeholder="APP_USR-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mp_access_token">Access Token</Label>
                    <Input
                      id="mp_access_token"
                      placeholder="APP_USR-..."
                      type="password"
                    />
                  </div>
                </>
              )}

              {selectedGateway?.id === "stripe" && (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Encontre suas chaves no Dashboard do Stripe → Developers → API keys
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="stripe_public_key">Publishable Key</Label>
                    <Input
                      id="stripe_public_key"
                      placeholder="pk_..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripe_secret_key">Secret Key</Label>
                    <Input
                      id="stripe_secret_key"
                      placeholder="sk_..."
                      type="password"
                    />
                  </div>
                </>
              )}

              {selectedGateway?.id === "infinitepay" && (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Acesse as credenciais no app InfinitePay → Configurações → Integrações
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="infinitepay_api_key">API Key</Label>
                    <Input
                      id="infinitepay_api_key"
                      placeholder="Sua chave de API"
                      type="password"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="docs" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Links Úteis</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {selectedGateway?.id === "asaas" && (
                      <>
                        <li>• <a href="https://docs.asaas.com" target="_blank" rel="noopener" className="text-primary hover:underline">Documentação oficial ASAAS</a></li>
                        <li>• <a href="https://www.asaas.com/api/v3/docs" target="_blank" rel="noopener" className="text-primary hover:underline">Referência da API</a></li>
                      </>
                    )}
                    {selectedGateway?.id === "mercadopago" && (
                      <>
                        <li>• <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener" className="text-primary hover:underline">Mercado Pago Developers</a></li>
                        <li>• <a href="https://www.mercadopago.com.br/developers/pt/docs" target="_blank" rel="noopener" className="text-primary hover:underline">Documentação</a></li>
                      </>
                    )}
                    {selectedGateway?.id === "stripe" && (
                      <>
                        <li>• <a href="https://stripe.com/docs" target="_blank" rel="noopener" className="text-primary hover:underline">Stripe Documentation</a></li>
                        <li>• <a href="https://stripe.com/docs/api" target="_blank" rel="noopener" className="text-primary hover:underline">API Reference</a></li>
                      </>
                    )}
                    {selectedGateway?.id === "infinitepay" && (
                      <>
                        <li>• <a href="https://infinitepay.io/" target="_blank" rel="noopener" className="text-primary hover:underline">InfinitePay</a></li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Configuração
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
