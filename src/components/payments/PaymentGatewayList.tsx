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

      let query = supabase
        .from("payment_gateways")
        .delete()
        .eq("gateway_name", gateway.id);

      // Se não for super admin, garantir que só delete do próprio tenant
      if (!isSuperAdmin) {
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("tenant_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!userRole?.tenant_id) {
          throw new Error("Tenant não encontrado");
        }
        query = query.eq("tenant_id", userRole.tenant_id);
      } else {
        query = query.is("tenant_id", null);
      }

      const { error } = await query;

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
