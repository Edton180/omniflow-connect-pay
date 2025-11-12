import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface QueueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queue?: any;
  onSuccess: () => void;
}

export const QueueDialog = ({ open, onOpenChange, queue, onSuccess }: QueueDialogProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#8B5CF6",
    sla_minutes: 30,
    is_active: true,
    routing_message: "Você foi direcionado para: {queue_name}",
  });

  useEffect(() => {
    if (queue) {
      setFormData({
        name: queue.name || "",
        description: queue.description || "",
        color: queue.color || "#8B5CF6",
        sla_minutes: queue.sla_minutes || 30,
        is_active: queue.is_active ?? true,
        routing_message: queue.routing_message || "Você foi direcionado para: {queue_name}",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        color: "#8B5CF6",
        sla_minutes: 30,
        is_active: true,
        routing_message: "Você foi direcionado para: {queue_name}",
      });
    }
  }, [queue, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        tenant_id: profile?.tenant_id,
      };

      if (queue) {
        const { error } = await supabase
          .from("queues")
          .update(dataToSave)
          .eq("id", queue.id);

        if (error) throw error;

        toast({
          title: "Fila atualizada",
          description: "A fila foi atualizada com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("queues")
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: "Fila criada",
          description: "A fila foi criada com sucesso.",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{queue ? "Editar Fila" : "Nova Fila"}</DialogTitle>
          <DialogDescription>
            {queue ? "Atualize as informações da fila" : "Cadastre uma nova fila de atendimento"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routing_message">Mensagem de Direcionamento</Label>
            <Textarea
              id="routing_message"
              value={formData.routing_message}
              onChange={(e) => setFormData({ ...formData, routing_message: e.target.value })}
              rows={2}
              placeholder="Você foi direcionado para: {queue_name}"
            />
            <p className="text-xs text-muted-foreground">
              Use <code className="bg-muted px-1 py-0.5 rounded">{'{queue_name}'}</code> para incluir o nome da opção selecionada
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sla_minutes">SLA (minutos)</Label>
              <Input
                id="sla_minutes"
                type="number"
                min="1"
                value={formData.sla_minutes}
                onChange={(e) => setFormData({ ...formData, sla_minutes: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Fila Ativa</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {queue ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
