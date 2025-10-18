import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: any | null;
  onSuccess: () => void;
}

export function PlanDialog({ open, onOpenChange, plan, onSuccess }: PlanDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    billing_period: "monthly",
    max_users: "",
    max_tickets: "",
    catalog_access: false,
    stripe_fee: 2.99,
    asaas_fee: 1.99,
    mercadopago_fee: 3.99,
    infinitepay_fee: 2.49,
  });

  useEffect(() => {
    if (plan) {
      const features = plan.features || {};
      setFormData({
        name: plan.name || "",
        description: plan.description || "",
        price: plan.price?.toString() || "",
        billing_period: plan.billing_period || "monthly",
        max_users: plan.max_users?.toString() || "",
        max_tickets: plan.max_tickets?.toString() || "",
        catalog_access: features.catalog_access || false,
        stripe_fee: features.stripe_fee || 2.99,
        asaas_fee: features.asaas_fee || 1.99,
        mercadopago_fee: features.mercadopago_fee || 3.99,
        infinitepay_fee: features.infinitepay_fee || 2.49,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        billing_period: "monthly",
        max_users: "",
        max_tickets: "",
        catalog_access: false,
        stripe_fee: 2.99,
        asaas_fee: 1.99,
        mercadopago_fee: 3.99,
        infinitepay_fee: 2.49,
      });
    }
  }, [plan]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price) {
      toast({
        title: "Erro",
        description: "Nome e preço são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const features = {
        catalog_access: formData.catalog_access,
        stripe_fee: formData.stripe_fee,
        asaas_fee: formData.asaas_fee,
        mercadopago_fee: formData.mercadopago_fee,
        infinitepay_fee: formData.infinitepay_fee,
      };

      const planData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        billing_period: formData.billing_period,
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
        max_tickets: formData.max_tickets ? parseInt(formData.max_tickets) : null,
        features,
        is_active: true,
        tenant_id: null,
      };

      if (plan) {
        const { error } = await supabase
          .from("plans")
          .update(planData)
          .eq("id", plan.id);

        if (error) throw error;

        toast({
          title: "Plano atualizado",
          description: "Plano atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from("plans")
          .insert(planData);

        if (error) throw error;

        toast({
          title: "Plano criado",
          description: "Plano criado com sucesso!",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalFee = formData.catalog_access 
    ? ((formData.stripe_fee + formData.asaas_fee + formData.mercadopago_fee + formData.infinitepay_fee) / 4).toFixed(2)
    : "0.00";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          <DialogDescription>
            Configure as funcionalidades e taxas do plano
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Plano Pro"
              />
            </div>
            <div className="space-y-2">
              <Label>Preço (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="99.90"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do plano"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Máx. Usuários</Label>
              <Input
                type="number"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                placeholder="Ilimitado"
              />
            </div>
            <div className="space-y-2">
              <Label>Máx. Tickets</Label>
              <Input
                type="number"
                value={formData.max_tickets}
                onChange={(e) => setFormData({ ...formData, max_tickets: e.target.value })}
                placeholder="Ilimitado"
              />
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Acesso ao Catálogo</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir venda de produtos online
                  </p>
                </div>
                <Switch
                  checked={formData.catalog_access}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, catalog_access: checked })
                  }
                />
              </div>

              {formData.catalog_access && (
                <div className="space-y-6 border-t pt-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Taxa Stripe: {formData.stripe_fee.toFixed(2)}%</Label>
                      <Badge variant="outline">{formData.stripe_fee.toFixed(2)}%</Badge>
                    </div>
                    <Slider
                      value={[formData.stripe_fee]}
                      onValueChange={([value]) => 
                        setFormData({ ...formData, stripe_fee: value })
                      }
                      min={0}
                      max={15}
                      step={0.01}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Taxa ASAAS: {formData.asaas_fee.toFixed(2)}%</Label>
                      <Badge variant="outline">{formData.asaas_fee.toFixed(2)}%</Badge>
                    </div>
                    <Slider
                      value={[formData.asaas_fee]}
                      onValueChange={([value]) => 
                        setFormData({ ...formData, asaas_fee: value })
                      }
                      min={0}
                      max={15}
                      step={0.01}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Taxa Mercado Pago: {formData.mercadopago_fee.toFixed(2)}%</Label>
                      <Badge variant="outline">{formData.mercadopago_fee.toFixed(2)}%</Badge>
                    </div>
                    <Slider
                      value={[formData.mercadopago_fee]}
                      onValueChange={([value]) => 
                        setFormData({ ...formData, mercadopago_fee: value })
                      }
                      min={0}
                      max={15}
                      step={0.01}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Taxa InfinitePay: {formData.infinitepay_fee.toFixed(2)}%</Label>
                      <Badge variant="outline">{formData.infinitepay_fee.toFixed(2)}%</Badge>
                    </div>
                    <Slider
                      value={[formData.infinitepay_fee]}
                      onValueChange={([value]) => 
                        setFormData({ ...formData, infinitepay_fee: value })
                      }
                      min={0}
                      max={15}
                      step={0.01}
                      className="w-full"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Taxa Média Total:</span>
                      <span className="text-primary">{totalFee}%</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : plan ? "Atualizar" : "Criar Plano"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
