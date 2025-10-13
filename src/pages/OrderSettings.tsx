import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function OrderSettings() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    min_order_value: "0",
    default_delivery_fee: "0",
    free_delivery_above: "",
    accepts_scheduled_orders: true,
    order_message: "Obrigado pelo seu pedido!",
    auto_print: false,
    sound_notification: true,
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (!user?.id) return;

      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) throw roleError;
      if (!userRole?.tenant_id) return;

      setTenantId(userRole.tenant_id);
      await loadSettings(userRole.tenant_id);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadSettings = async (tid: string) => {
    const { data, error } = await supabase
      .from("catalog_order_settings")
      .select("*")
      .eq("tenant_id", tid)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setFormData({
        min_order_value: data.min_order_value?.toString() || "0",
        default_delivery_fee: data.default_delivery_fee?.toString() || "0",
        free_delivery_above: data.free_delivery_above?.toString() || "",
        accepts_scheduled_orders: data.accepts_scheduled_orders ?? true,
        order_message: data.order_message || "Obrigado pelo seu pedido!",
        auto_print: data.auto_print ?? false,
        sound_notification: data.sound_notification ?? true,
      });
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const dataToSave = {
        tenant_id: tenantId,
        min_order_value: parseFloat(formData.min_order_value) || 0,
        default_delivery_fee: parseFloat(formData.default_delivery_fee) || 0,
        free_delivery_above: formData.free_delivery_above ? parseFloat(formData.free_delivery_above) : null,
        accepts_scheduled_orders: formData.accepts_scheduled_orders,
        order_message: formData.order_message,
        auto_print: formData.auto_print,
        sound_notification: formData.sound_notification,
      };

      const { error } = await supabase
        .from("catalog_order_settings")
        .upsert(dataToSave, { onConflict: "tenant_id" });

      if (error) throw error;

      toast({ title: "Configurações salvas com sucesso" });
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white shadow-glow">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Configurações de Pedidos</h1>
              <p className="text-xs text-foreground/60">Configure como funcionam os pedidos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Valores e Taxas</CardTitle>
              <CardDescription>Configure valores mínimos e taxas de entrega</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Valor Mínimo do Pedido (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.min_order_value}
                  onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                />
              </div>
              <div>
                <Label>Taxa de Entrega Padrão (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.default_delivery_fee}
                  onChange={(e) => setFormData({ ...formData, default_delivery_fee: e.target.value })}
                />
              </div>
              <div>
                <Label>Frete Grátis Acima de (R$) - Opcional</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.free_delivery_above}
                  onChange={(e) => setFormData({ ...formData, free_delivery_above: e.target.value })}
                  placeholder="Deixe vazio se não oferece frete grátis"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mensagens e Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Mensagem de Confirmação</Label>
                <Textarea
                  value={formData.order_message}
                  onChange={(e) => setFormData({ ...formData, order_message: e.target.value })}
                  rows={3}
                  placeholder="Mensagem exibida após confirmar pedido"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificação Sonora</Label>
                  <p className="text-xs text-muted-foreground">
                    Tocar som ao receber novo pedido
                  </p>
                </div>
                <Switch
                  checked={formData.sound_notification}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, sound_notification: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opções Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Aceitar Pedidos Agendados</Label>
                  <p className="text-xs text-muted-foreground">
                    Permitir que clientes agendem pedidos para depois
                  </p>
                </div>
                <Switch
                  checked={formData.accepts_scheduled_orders}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, accepts_scheduled_orders: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Impressão Automática</Label>
                  <p className="text-xs text-muted-foreground">
                    Imprimir pedidos automaticamente ao receber
                  </p>
                </div>
                <Switch
                  checked={formData.auto_print}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, auto_print: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")} 
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
