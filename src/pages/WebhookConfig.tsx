import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Save, Plus, Trash2, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WebhookConfig() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newConfig, setNewConfig] = useState({
    gateway: "",
    webhook_url: "",
    webhook_token: "",
    is_active: true,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!userRole) return;

      let query = supabase
        .from("webhook_configs")
        .select("*")
        .order("created_at", { ascending: false });

      if (userRole.role !== "super_admin") {
        query = query.eq("tenant_id", userRole.tenant_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setConfigs(data || []);
    } catch (error: any) {
      console.error("Error loading configs:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (config?: any) => {
    const configToSave = config || newConfig;
    const isNew = !config;

    try {
      setSaving(isNew ? "new" : config.id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!userRole?.tenant_id) throw new Error("Tenant não encontrado");

      const data: any = {
        ...configToSave,
        tenant_id: userRole.tenant_id,
      };

      if (isNew) {
        const { error } = await supabase
          .from("webhook_configs")
          .insert(data);

        if (error) throw error;

        setDialogOpen(false);
        setNewConfig({
          gateway: "",
          webhook_url: "",
          webhook_token: "",
          is_active: true,
        });
      } else {
        const { error } = await supabase
          .from("webhook_configs")
          .update(data)
          .eq("id", config.id);

        if (error) throw error;
      }

      toast.success("Configuração salva com sucesso!");
      loadConfigs();
    } catch (error: any) {
      console.error("Error saving config:", error);
      toast.error(error.message || "Erro ao salvar configuração");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta configuração?")) return;

    try {
      const { error } = await supabase
        .from("webhook_configs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Configuração excluída com sucesso!");
      loadConfigs();
    } catch (error: any) {
      console.error("Error deleting config:", error);
      toast.error("Erro ao excluir configuração");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para área de transferência!");
  };

  const getGatewayBadge = (gateway: string) => {
    const colors: Record<string, string> = {
      asaas: "bg-blue-500",
      stripe: "bg-purple-500",
      mercadopago: "bg-cyan-500",
      paypal: "bg-blue-600",
    };

    return (
      <Badge className={colors[gateway] || "bg-gray-500"}>
        {gateway.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuração de Webhooks</h1>
          <p className="text-muted-foreground">
            Configure URLs e tokens personalizados para receber notificações
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Gateway</Label>
                <Select
                  value={newConfig.gateway}
                  onValueChange={(value) => setNewConfig({ ...newConfig, gateway: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asaas">ASAAS</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>URL do Webhook</Label>
                <Input
                  placeholder="https://seu-dominio.com/webhook"
                  value={newConfig.webhook_url}
                  onChange={(e) => setNewConfig({ ...newConfig, webhook_url: e.target.value })}
                />
              </div>

              <div>
                <Label>Token de Segurança</Label>
                <Input
                  type="password"
                  placeholder="Token secreto para validação"
                  value={newConfig.webhook_token}
                  onChange={(e) => setNewConfig({ ...newConfig, webhook_token: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Gere um token aleatório e seguro para validar as requisições
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch
                  checked={newConfig.is_active}
                  onCheckedChange={(checked) => setNewConfig({ ...newConfig, is_active: checked })}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => handleSave()}
                disabled={saving === "new"}
              >
                {saving === "new" ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Como Configurar</CardTitle>
          <CardDescription>
            Siga estas etapas para configurar webhooks personalizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Configure um endpoint HTTPS no seu servidor para receber as notificações</p>
          <p>2. Gere um token secreto único para validar as requisições</p>
          <p>3. Adicione o webhook usando o botão "Novo Webhook"</p>
          <p>4. Configure o mesmo token no painel do gateway de pagamento</p>
          <p className="text-muted-foreground italic mt-4">
            ⚠️ Importante: Sempre valide o token nas requisições recebidas para garantir segurança
          </p>
        </CardContent>
      </Card>

      {/* Configs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                {getGatewayBadge(config.gateway)}
                <Badge variant={config.is_active ? "default" : "secondary"}>
                  {config.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">URL do Webhook</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-muted p-2 rounded flex-1 truncate">
                    {config.webhook_url}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(config.webhook_url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => window.open(config.webhook_url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Token</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-muted p-2 rounded flex-1">
                    ••••••••••••••••
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(config.webhook_token)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setNewConfig(config);
                    setDialogOpen(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(config.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && configs.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-center mb-4">
                Nenhum webhook configurado ainda
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Webhook
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
