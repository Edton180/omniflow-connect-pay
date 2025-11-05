import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ManualInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  tenantName: string;
  subscriptionId?: string;
  onSuccess?: () => void;
}

export function ManualInvoiceDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  subscriptionId,
  onSuccess,
}: ManualInvoiceDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    currency: "BRL",
    description: "",
    due_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dueDate = new Date(formData.due_date);
      dueDate.setHours(23, 59, 59);

      const { error } = await supabase.from("invoices").insert({
        tenant_id: tenantId,
        subscription_id: subscriptionId || null,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description || `Fatura manual - ${tenantName}`,
        due_date: dueDate.toISOString(),
        status: "pending",
        metadata: { manual: true, created_by: "super_admin" },
      });

      if (error) throw error;

      toast({
        title: "Fatura criada",
        description: "Fatura manual criada com sucesso.",
      });

      onSuccess?.();
      onOpenChange(false);
      setFormData({ amount: "", currency: "BRL", description: "", due_date: "" });
    } catch (error: any) {
      toast({
        title: "Erro ao criar fatura",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Fatura Manual</DialogTitle>
          <DialogDescription>
            Gerar fatura avulsa para {tenantName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="currency">Moeda</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">BRL (R$)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="due_date">Vencimento *</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes da fatura..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
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
              Criar Fatura
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
