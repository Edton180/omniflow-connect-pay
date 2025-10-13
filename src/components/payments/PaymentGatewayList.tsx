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

      // Verificar se é super admin
      const { data: isSuperAdmin } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      let query = supabase
        .from("payment_gateways")
        .select("gateway_name, is_active")
        .eq("is_active", true);

      // Se não for super admin, filtrar por tenant
      if (!isSuperAdmin) {
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("tenant_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!userRole?.tenant_id) return;
        query = query.eq("tenant_id", userRole.tenant_id);
      }

      const { data: savedGateways } = await query;

      if (savedGateways) {
        setConnectedGateways(new Set(savedGateways.map(g => g.gateway_name)));
      }
    } catch (error) {
      console.error("Error loading gateways:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = async (gateway: any) => {
    setSelectedGateway(gateway);
    setDialogOpen(true);
    
    // Carregar credenciais salvas
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: isSuperAdmin } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      let query = supabase
        .from("payment_gateways")
        .select("*")
        .eq("gateway_name", gateway.id)
        .eq("is_active", true);

      if (!isSuperAdmin) {
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("tenant_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (userRole?.tenant_id) {
          query = query.eq("tenant_id", userRole.tenant_id);
        }
      }

      const { data: savedGateway } = await query.maybeSingle();

      if (savedGateway?.config) {
        // Preencher os campos com os valores salvos
        setTimeout(() => {
          const config = savedGateway.config as any;
          
          if (gateway.id === "asaas" && config.api_key) {
            const apiKeyInput = document.getElementById("asaas_api_key") as HTMLInputElement;
            const walletInput = document.getElementById("asaas_wallet_id") as HTMLInputElement;
            if (apiKeyInput) apiKeyInput.value = config.api_key;
            if (walletInput && config.wallet_id) walletInput.value = config.wallet_id;
          } else if (gateway.id === "mercadopago") {
            const publicKeyInput = document.getElementById("mp_public_key") as HTMLInputElement;
            const accessTokenInput = document.getElementById("mp_access_token") as HTMLInputElement;
            if (publicKeyInput && config.public_key) publicKeyInput.value = config.public_key;
            if (accessTokenInput && config.access_token) accessTokenInput.value = config.access_token;
          } else if (gateway.id === "stripe") {
            const publicKeyInput = document.getElementById("stripe_public_key") as HTMLInputElement;
            const secretKeyInput = document.getElementById("stripe_secret_key") as HTMLInputElement;
            if (publicKeyInput && config.public_key) publicKeyInput.value = config.public_key;
            if (secretKeyInput && config.secret_key) secretKeyInput.value = config.secret_key;
          } else if (gateway.id === "infinitepay" && config.api_key) {
            const apiKeyInput = document.getElementById("infinitepay_api_key") as HTMLInputElement;
            if (apiKeyInput) apiKeyInput.value = config.api_key;
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error loading gateway config:", error);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Auth error:", authError);
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      // Verificar se é super admin
      const { data: isSuperAdmin } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      let tenantId = null;

      // Se não for super admin, buscar tenant_id
      if (!isSuperAdmin) {
        const { data: userRole, error: roleError } = await supabase
          .from("user_roles")
          .select("tenant_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleError || !userRole?.tenant_id) {
          toast({
            title: "Erro",
            description: "Você não está associado a nenhuma empresa.",
            variant: "destructive",
          });
          return;
        }
        tenantId = userRole.tenant_id;
      }

      console.log("Saving payment gateway. Tenant:", tenantId, "IsSuperAdmin:", !!isSuperAdmin);

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

      const gatewayData = {
        tenant_id: tenantId,
        gateway_name: selectedGateway.id,
        api_key_encrypted: apiKey || "",
        config: config,
        is_active: true,
      };

      console.log("Gateway data to save:", gatewayData);

      // Check if gateway already exists for this tenant
      let query = supabase
        .from("payment_gateways")
        .select("id")
        .eq("gateway_name", selectedGateway.id);
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      } else {
        query = query.is("tenant_id", null);
      }

      const { data: existing } = await query.maybeSingle();

      let result;
      if (existing) {
        // Update existing
        result = await supabase
          .from("payment_gateways")
          .update({
            api_key_encrypted: gatewayData.api_key_encrypted,
            config: gatewayData.config,
            is_active: true,
          })
          .eq("id", existing.id)
          .select();
      } else {
        // Insert new
        result = await supabase
          .from("payment_gateways")
          .insert(gatewayData)
          .select();
      }

      if (result.error) {
        console.error("Error saving gateway:", result.error);
        throw result.error;
      }

      toast({
        title: "Configuração salva",
        description: `Gateway ${selectedGateway?.name} configurado com sucesso.`,
      });
      setDialogOpen(false);
      await loadGateways();
    } catch (error: any) {
      console.error("Error in handleSave:", error);
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
            <p className="text-sm text-foreground/60">
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
                  <ul className="space-y-2 text-sm text-foreground/70">
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
