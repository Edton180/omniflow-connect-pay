import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: any;
  tenantId: string;
  onSuccess: () => void;
}

export function CategoryDialog({ open, onOpenChange, category, tenantId, onSuccess }: CategoryDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    position: "0",
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        image_url: category.image_url || "",
        position: category.position?.toString() || "0",
      });
    } else {
      setFormData({ name: "", description: "", image_url: "", position: "0" });
    }
  }, [category, open]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      const dataToSave = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
        position: parseInt(formData.position) || 0,
        tenant_id: tenantId,
        is_active: true,
      };

      if (category) {
        const { error } = await supabase
          .from("catalog_categories")
          .update(dataToSave)
          .eq("id", category.id);

        if (error) throw error;
        toast({ title: "Categoria atualizada com sucesso" });
      } else {
        const { error } = await supabase
          .from("catalog_categories")
          .insert(dataToSave);

        if (error) throw error;
        toast({ title: "Categoria criada com sucesso" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar categoria",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Pizzas, Bebidas, Sobremesas"
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição da categoria"
              rows={3}
            />
          </div>
          <div>
            <Label>URL da Imagem</Label>
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>Posição</Label>
            <Input
              type="number"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="0"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1">
              {category ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
