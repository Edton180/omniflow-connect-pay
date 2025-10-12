import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Settings, CheckCircle, XCircle } from "lucide-react";

interface PaymentGatewayCardProps {
  gateway: {
    id: string;
    name: string;
    description: string;
    logo?: string;
    connected: boolean;
    status?: string;
  };
  onConfigure: () => void;
}

const getIcon = () => CreditCard;

const getColor = (name: string) => {
  const colors: Record<string, string> = {
    asaas: "bg-blue-600",
    mercadopago: "bg-sky-500",
    stripe: "bg-purple-600",
    infinitepay: "bg-orange-500",
  };
  return colors[name.toLowerCase()] || "bg-gray-500";
};

export const PaymentGatewayCard = ({ gateway, onConfigure }: PaymentGatewayCardProps) => {
  const Icon = getIcon();
  const colorClass = getColor(gateway.name);

  return (
    <Card className="gradient-card hover-scale">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-lg ${colorClass} flex items-center justify-center text-white`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{gateway.name}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {gateway.description}
              </CardDescription>
            </div>
          </div>
          {gateway.connected ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={gateway.connected ? "default" : "secondary"}>
            {gateway.connected ? "Conectado" : "Não Conectado"}
          </Badge>
        </div>
        <Button
          variant={gateway.connected ? "outline" : "default"}
          className="w-full"
          onClick={onConfigure}
        >
          <Settings className="mr-2 h-4 w-4" />
          {gateway.connected ? "Configurar" : "Conectar"}
        </Button>
      </CardContent>
    </Card>
  );
};
