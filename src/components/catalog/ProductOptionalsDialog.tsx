import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductOptionalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}

export function ProductOptionalsDialog({ 
  open, 
  onOpenChange, 
  productId,
  productName 
}: ProductOptionalsDialogProps) {
  const { toast } = useToast();
  const [optionals, setOptionals] = useState<any[]>([]);
  const [newOptional, setNewOptional] = useState({
    name: "",
    price: "0",
    max_quantity: "1",
    is_required: false,
  });

  useEffect(() => {
    if (open) {
      loadOptionals();
    }
  }, [open, productId]);

  const loadOptionals = async () => {
    const { data, error } = await supabase
      .from("catalog_product_optionals")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Erro ao carregar opcionais",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setOptionals(data || []);
  };

  const handleAdd = async () => {
    if (!newOptional.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do opcional é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("catalog_product_optionals")
        .insert({
          product_id: productId,
          name: newOptional.name.trim(),
          price: parseFloat(newOptional.price) || 0,
          max_quantity: parseInt(newOptional.max_quantity) || 1,
          is_required: newOptional.is_required,
          is_active: true,
        });

      if (error) throw error;

      toast({ title: "Opcional adicionado" });
      setNewOptional({ name: "", price: "0", max_quantity: "1", is_required: false });
      await loadOptionals();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar opcional",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("catalog_product_optionals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Opcional removido" });
      await loadOptionals();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Opcionais de {productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                  <Label className="text-xs">Nome do Opcional</Label>
                  <Input
                    value={newOptional.name}
                    onChange={(e) => setNewOptional({ ...newOptional, name: e.target.value })}
                    placeholder="Ex: Borda Recheada, Bacon Extra"
                  />
                </div>
                <div>
                  <Label className="text-xs">Preço</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newOptional.price}
                    onChange={(e) => setNewOptional({ ...newOptional, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAdd} className="w-full">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-3">
                <Checkbox
                  id="required"
                  checked={newOptional.is_required}
                  onCheckedChange={(checked) => 
                    setNewOptional({ ...newOptional, is_required: checked as boolean })
                  }
                />
                <Label htmlFor="required" className="text-xs cursor-pointer">
                  Obrigatório
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {optionals.map((optional) => (
              <Card key={optional.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {optional.name}
                      {optional.is_required && (
                        <span className="ml-2 text-xs text-destructive">(Obrigatório)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      R$ {parseFloat(optional.price).toFixed(2)}
                      {optional.max_quantity > 1 && ` • Máx: ${optional.max_quantity}`}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(optional.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {optionals.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum opcional cadastrado. Adicione complementos e extras para seus produtos.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
