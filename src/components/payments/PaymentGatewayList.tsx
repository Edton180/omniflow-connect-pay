import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentGatewayCard } from "./PaymentGatewayCard";
import { PaymentGatewayDialog } from "./PaymentGatewayDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
      id: "paypal",
      name: "PayPal",
      description: "Pagamentos globais via PayPal",
    },
    {
      id: "manual",
      name: "Pagamento Manual",
      description: "Configure PIX ou link de pagamento próprio com envio de comprovante",
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

      console.log("Carregando gateways - Super Admin:", !!isSuperAdmin);

      // CRÍTICO: Carregar APENAS gateways globais (tenant_id NULL)
      // Gateways são sempre globais no sistema
      const { data: savedGateways, error } = await supabase
        .from("payment_gateways")
        .select("gateway_name, is_active, tenant_id")
        .eq("is_active", true)
        .is("tenant_id", null); // Apenas gateways globais

      if (error) {
        console.error("Erro ao carregar gateways:", error);
        throw error;
      }

      console.log("Gateways globais encontrados:", savedGateways);

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

  const handleDisconnect = async (gateway: any) => {
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

      // CRÍTICO: Apenas Super Admins podem desconectar gateways globais
      if (!isSuperAdmin) {
        throw new Error("Apenas Super Admins podem desconectar gateways de pagamento");
      }

      console.log("Desconectando gateway global:", gateway.id);

      // Deletar gateway global
      const { error } = await supabase
        .from("payment_gateways")
        .delete()
        .eq("gateway_name", gateway.id)
        .is("tenant_id", null);

      if (error) throw error;

      toast({
        title: "Gateway desconectado",
        description: `${gateway.name} foi desconectado com sucesso`,
      });

      loadGateways();
    } catch (error: any) {
      console.error("Error disconnecting gateway:", error);
      toast({
        title: "Erro ao desconectar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    loadGateways();
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Super Admin:</strong> Os gateways configurados aqui serão
          usados globalmente por todos os tenants do sistema.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {gateways.map((gateway) => (
          <PaymentGatewayCard
            key={gateway.id}
            gateway={gateway}
            onConfigure={() => handleConfigure(gateway)}
            onDisconnect={() => handleDisconnect(gateway)}
            loading={loading}
          />
        ))}
        
        <Card className="border-dashed bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
            <Info className="h-8 w-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Mais gateways em breve
            </p>
          </CardContent>
        </Card>
      </div>

      {selectedGateway && (
        <PaymentGatewayDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          gateway={selectedGateway}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
