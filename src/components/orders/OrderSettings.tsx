import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Clock, DollarSign, Truck, CreditCard } from "lucide-react";

interface OrderSettingsData {
  min_order_value: number;
  default_delivery_fee: number;
  free_delivery_above: number | null;
  working_hours: Record<string, { open: string; close: string }>;
  accepts_scheduled_orders: boolean;
}

const DELIVERY_TYPES = [
  { id: "delivery", label: "Entrega" },
  { id: "pickup", label: "Retirada" },
  { id: "dine_in", label: "Consumir no Local" },
];

const PAYMENT_METHODS = [
  { id: "pix", label: "PIX" },
  { id: "credit_card", label: "Cartão de Crédito" },
  { id: "debit_card", label: "Cartão de Débito" },
  { id: "cash", label: "Dinheiro" },
];

export function OrderSettings({ tenantId }: { tenantId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<OrderSettingsData>({
    min_order_value: 0,
    default_delivery_fee: 0,
    free_delivery_above: null,
    working_hours: {
      monday: { open: "08:00", close: "22:00" },
      tuesday: { open: "08:00", close: "22:00" },
      wednesday: { open: "08:00", close: "22:00" },
      thursday: { open: "08:00", close: "22:00" },
      friday: { open: "08:00", close: "22:00" },
      saturday: { open: "08:00", close: "22:00" },
      sunday: { open: "08:00", close: "22:00" },
    },
    accepts_scheduled_orders: true,
  });
  const [selectedDeliveryTypes, setSelectedDeliveryTypes] = useState<string[]>(["delivery"]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(["pix"]);

  useEffect(() => {
    loadSettings();
  }, [tenantId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("catalog_order_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const workingHours = data.working_hours && typeof data.working_hours === 'object' 
          ? data.working_hours as Record<string, { open: string; close: string }>
          : settings.working_hours;
          
        setSettings({
          min_order_value: data.min_order_value || 0,
          default_delivery_fee: data.default_delivery_fee || 0,
          free_delivery_above: data.free_delivery_above,
          working_hours: workingHours,
          accepts_scheduled_orders: data.accepts_scheduled_orders ?? true,
        });
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("catalog_order_settings")
        .upsert(
          {
            tenant_id: tenantId,
            ...settings,
          },
          { onConflict: "tenant_id" }
        );

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações de pedidos foram atualizadas.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Pedidos
          </CardTitle>
          <CardDescription>
            Configure valores mínimos, taxas e horários de funcionamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min_order" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor Mínimo do Pedido
              </Label>
              <Input
                id="min_order"
                type="number"
                min="0"
                step="0.01"
                value={settings.min_order_value}
                onChange={(e) =>
                  setSettings({ ...settings, min_order_value: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_fee" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Taxa de Entrega Padrão
              </Label>
              <Input
                id="delivery_fee"
                type="number"
                min="0"
                step="0.01"
                value={settings.default_delivery_fee}
                onChange={(e) =>
                  setSettings({ ...settings, default_delivery_fee: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="free_delivery">Frete Grátis Acima de</Label>
              <Input
                id="free_delivery"
                type="number"
                min="0"
                step="0.01"
                value={settings.free_delivery_above || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    free_delivery_above: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="Deixe vazio para desabilitar"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Tipos de Entrega
            </Label>
            <div className="space-y-2">
              {DELIVERY_TYPES.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={selectedDeliveryTypes.includes(type.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDeliveryTypes([...selectedDeliveryTypes, type.id]);
                      } else {
                        setSelectedDeliveryTypes(
                          selectedDeliveryTypes.filter((t) => t !== type.id)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={type.id} className="font-normal cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Métodos de Pagamento
            </Label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <div key={method.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={method.id}
                    checked={selectedPaymentMethods.includes(method.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPaymentMethods([...selectedPaymentMethods, method.id]);
                      } else {
                        setSelectedPaymentMethods(
                          selectedPaymentMethods.filter((m) => m !== method.id)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={method.id} className="font-normal cursor-pointer">
                    {method.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
