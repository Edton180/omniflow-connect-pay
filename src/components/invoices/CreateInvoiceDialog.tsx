import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateInvoiceDialog = ({ open, onOpenChange, onSuccess }: CreateInvoiceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    tenant_id: "",
    plan_id: "",
    due_date: "",
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [tenantsRes, plansRes] = await Promise.all([
        supabase.from("tenants").select("id, name").order("name"),
        supabase.from("plans").select("*").order("price"),
      ]);

      if (tenantsRes.error) throw tenantsRes.error;
      if (plansRes.error) throw plansRes.error;

      setTenants(tenantsRes.data || []);
      setPlans(plansRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    }
  };

  const handleSubmit = async () => {
    if (!formData.tenant_id || !formData.plan_id || !formData.due_date) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const plan = plans.find(p => p.id === formData.plan_id);
      if (!plan) throw new Error("Plano não encontrado");

      const { error } = await supabase.from("invoices").insert({
        tenant_id: formData.tenant_id,
        amount: plan.price,
        currency: plan.currency || "BRL",
        due_date: formData.due_date,
        status: "pending",
        description: `Fatura Manual - ${plan.name}`,
      });

      if (error) throw error;

      toast.success("Fatura criada com sucesso!");
      setFormData({ tenant_id: "", plan_id: "", due_date: "" });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error(error.message || "Erro ao criar fatura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Fatura</DialogTitle>
          <DialogDescription>
            Gere uma fatura manual para uma empresa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Empresa *</Label>
            <Select
              value={formData.tenant_id}
              onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Plano *</Label>
            <Select
              value={formData.plan_id}
              onValueChange={(value) => setFormData({ ...formData, plan_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - {plan.billing_period === 'yearly' ? 'Anual' : 'Mensal'} - R$ {plan.price?.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data de Vencimento *</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Fatura"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
