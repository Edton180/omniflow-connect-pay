import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Percent } from "lucide-react";

interface PlanFeaturesProps {
  planId: string;
  catalogAccess: boolean;
  gatewayFees: Record<string, number>;
  onCatalogAccessChange: (enabled: boolean) => void;
  onGatewayFeeChange: (gateway: string, fee: number) => void;
}

const GATEWAYS = [
  { id: "stripe", name: "Stripe", color: "bg-blue-500" },
  { id: "mercadopago", name: "Mercado Pago", color: "bg-cyan-500" },
  { id: "asaas", name: "ASAAS", color: "bg-green-500" },
  { id: "infinitepay", name: "InfinitePay", color: "bg-purple-500" },
];

export function PlanFeatures({
  planId,
  catalogAccess,
  gatewayFees,
  onCatalogAccessChange,
  onGatewayFeeChange,
}: PlanFeaturesProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Recursos do Plano
          </CardTitle>
          <CardDescription>
            Configure acesso ao catálogo e taxas por gateway
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="catalog-access" className="text-base font-medium">
                Acesso ao Catálogo
              </Label>
              <p className="text-sm text-muted-foreground">
                Permite criar e gerenciar produtos para venda
              </p>
            </div>
            <Switch
              id="catalog-access"
              checked={catalogAccess}
              onCheckedChange={onCatalogAccessChange}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">
                Taxas por Gateway de Pagamento
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure a porcentagem de taxa cobrada em cada transação
            </p>

            {GATEWAYS.map((gateway) => {
              const fee = gatewayFees[gateway.id] || 0;
              return (
                <div key={gateway.id} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${gateway.color}`} />
                      <span className="font-medium">{gateway.name}</span>
                    </div>
                    <Badge variant="outline">{fee.toFixed(2)}%</Badge>
                  </div>
                  <Slider
                    value={[fee]}
                    onValueChange={([value]) => onGatewayFeeChange(gateway.id, value)}
                    min={0}
                    max={15}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>15%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
