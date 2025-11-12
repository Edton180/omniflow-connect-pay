import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Settings, CheckCircle, XCircle, Loader2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PaymentGatewayCardProps {
  gateway: {
    id: string;
    name: string;
    description: string;
    logo?: string;
    connected: boolean;
    status?: string;
    webhookUrl?: string;
  };
  onConfigure: () => void;
  loading?: boolean;
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

export const PaymentGatewayCard = ({ gateway, onConfigure, loading = false }: PaymentGatewayCardProps) => {
  const Icon = getIcon();
  const colorClass = getColor(gateway.name);

  const getWebhookUrl = () => {
    const baseUrl = window.location.origin;
    const gatewayName = gateway.name.toLowerCase().replace(/\s+/g, "");
    return `${baseUrl}/api/${gatewayName}-webhook`;
  };

  const webhookUrl = gateway.webhookUrl || getWebhookUrl();

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("URL do webhook copiada!");
  };

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

        {gateway.connected && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">URL do Webhook</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={copyWebhookUrl}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-background px-2 py-1 rounded flex-1 truncate">
                {webhookUrl}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => window.open(webhookUrl, "_blank")}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure esta URL no painel do {gateway.name} para receber notificações de pagamento.
            </p>
          </div>
        )}

        <Button
          variant={gateway.connected ? "outline" : "default"}
          className="w-full"
          onClick={onConfigure}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Settings className="mr-2 h-4 w-4" />
          )}
          {gateway.connected ? "Configurar" : "Conectar"}
        </Button>
      </CardContent>
    </Card>
  );
};
