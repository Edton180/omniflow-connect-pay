import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductVariationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}

export function ProductVariationsDialog({ 
  open, 
  onOpenChange, 
  productId,
  productName 
}: ProductVariationsDialogProps) {
  const { toast } = useToast();
  const [variations, setVariations] = useState<any[]>([]);
  const [newVariation, setNewVariation] = useState({
    name: "",
    option_name: "",
    price_adjustment: "0",
    stock_quantity: "0",
  });

  useEffect(() => {
    if (open) {
      loadVariations();
    }
  }, [open, productId]);

  const loadVariations = async () => {
    const { data, error } = await supabase
      .from("catalog_product_variations")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Erro ao carregar variações",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setVariations(data || []);
  };

  const handleAdd = async () => {
    if (!newVariation.name.trim() || !newVariation.option_name.trim()) {
      toast({
        title: "Erro",
        description: "Nome e opção são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("catalog_product_variations")
        .insert({
          product_id: productId,
          name: newVariation.name.trim(),
          option_name: newVariation.option_name.trim(),
          price_adjustment: parseFloat(newVariation.price_adjustment) || 0,
          stock_quantity: parseInt(newVariation.stock_quantity) || 0,
          is_active: true,
        });

      if (error) throw error;

      toast({ title: "Variação adicionada" });
      setNewVariation({ name: "", option_name: "", price_adjustment: "0", stock_quantity: "0" });
      await loadVariations();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar variação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("catalog_product_variations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Variação removida" });
      await loadVariations();
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
          <DialogTitle>Variações de {productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">Nome (ex: Tamanho)</Label>
                  <Input
                    value={newVariation.name}
                    onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
                    placeholder="Tamanho"
                  />
                </div>
                <div>
                  <Label className="text-xs">Opção (ex: Grande)</Label>
                  <Input
                    value={newVariation.option_name}
                    onChange={(e) => setNewVariation({ ...newVariation, option_name: e.target.value })}
                    placeholder="Grande"
                  />
                </div>
                <div>
                  <Label className="text-xs">Ajuste Preço</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newVariation.price_adjustment}
                    onChange={(e) => setNewVariation({ ...newVariation, price_adjustment: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAdd} className="w-full">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {variations.map((variation) => (
              <Card key={variation.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{variation.name}: {variation.option_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Ajuste: R$ {parseFloat(variation.price_adjustment).toFixed(2)} 
                      {variation.stock_quantity > 0 && ` • Estoque: ${variation.stock_quantity}`}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(variation.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {variations.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma variação cadastrada. Adicione tamanhos, sabores, etc.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
