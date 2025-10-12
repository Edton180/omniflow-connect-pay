import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: any;
  onSuccess: () => void;
}

export function PlanDialog({ open, onOpenChange, plan, onSuccess }: PlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    max_users: "",
    max_tickets: "",
    features: {
      publico: true,
      grupos: true,
      campanhas: true,
      integracoes: true,
      imp_mensagens: true,
    }
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || "",
        description: plan.description || "",
        price: plan.price?.toString() || "",
        max_users: plan.max_users?.toString() || "",
        max_tickets: plan.max_tickets?.toString() || "",
        features: typeof plan.features === 'object' ? plan.features : {
          publico: true,
          grupos: true,
          campanhas: true,
          integracoes: true,
          imp_mensagens: true,
        }
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        max_users: "",
        max_tickets: "",
        features: {
          publico: true,
          grupos: true,
          campanhas: true,
          integracoes: true,
          imp_mensagens: true,
        }
      });
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const planData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        max_users: parseInt(formData.max_users) || null,
        max_tickets: parseInt(formData.max_tickets) || null,
        features: formData.features,
        tenant_id: null, // Global plans
        billing_period: "monthly",
        currency: "BRL",
        is_active: true
      };

      if (plan) {
        const { error } = await supabase
          .from("plans")
          .update(planData)
          .eq("id", plan.id);

        if (error) throw error;
        toast.success("Plano atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("plans")
          .insert(planData);

        if (error) throw error;
        toast.success("Plano criado com sucesso!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving plan:", error);
      toast.error(error.message || "Erro ao salvar plano");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar Plano" : "Criar Plano"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Informações</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Plano</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do plano"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_users">Máx. Usuários</Label>
                <Input
                  id="max_users"
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                  placeholder="Número de usuários"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_tickets">Máx. Conexões</Label>
                <Input
                  id="max_tickets"
                  type="number"
                  value={formData.max_tickets}
                  onChange={(e) => setFormData({ ...formData, max_tickets: e.target.value })}
                  placeholder="Número de conexões"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Valor</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Recursos Incluídos</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="publico"
                    checked={formData.features.publico}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, features: { ...formData.features, publico: checked as boolean }})
                    }
                  />
                  <label htmlFor="publico" className="text-sm">Público</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="grupos"
                    checked={formData.features.grupos}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, features: { ...formData.features, grupos: checked as boolean }})
                    }
                  />
                  <label htmlFor="grupos" className="text-sm">Grupos</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="campanhas"
                    checked={formData.features.campanhas}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, features: { ...formData.features, campanhas: checked as boolean }})
                    }
                  />
                  <label htmlFor="campanhas" className="text-sm">Campanhas</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="integracoes"
                    checked={formData.features.integracoes}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, features: { ...formData.features, integracoes: checked as boolean }})
                    }
                  />
                  <label htmlFor="integracoes" className="text-sm">Integrações</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="imp_mensagens"
                    checked={formData.features.imp_mensagens}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, features: { ...formData.features, imp_mensagens: checked as boolean }})
                    }
                  />
                  <label htmlFor="imp_mensagens" className="text-sm">Imp. Mensagens</label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {plan ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}