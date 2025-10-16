import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  has_variations: boolean;
}

export function CatalogFullEdit({ tenantId }: { tenantId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
    setupRealtime();
  }, [tenantId]);

  const setupRealtime = () => {
    const channel = supabase
      .channel('catalog_products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'catalog_products',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => loadProducts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar produtos',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddProduct = () => {
    setProducts([
      {
        name: '',
        description: '',
        price: 0,
        has_variations: false,
      },
      ...products,
    ]);
  };

  const handleSaveProduct = async (product: Product, index: number) => {
    setLoading(true);
    try {
      if (product.id) {
        // Update
        const { error } = await supabase
          .from('catalog_products')
          .update({
            name: product.name,
            description: product.description,
            price: product.price,
            image_url: product.image_url,
            has_variations: product.has_variations,
          })
          .eq('id', product.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('catalog_products')
          .insert({
            ...product,
            tenant_id: tenantId,
            is_active: true,
          });

        if (error) throw error;
      }

      toast({
        title: 'Produto salvo',
        description: 'Produto salvo com sucesso!',
      });

      await loadProducts();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar produto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('catalog_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Produto excluído',
        description: 'Produto excluído com sucesso!',
      });

      await loadProducts();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir produto',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Produtos</h2>
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Produto
        </Button>
      </div>

      <div className="grid gap-4">
        {products.map((product, index) => (
          <Card key={product.id || `new-${index}`}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>
                  {product.name || 'Novo Produto'}
                </span>
                {product.id && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>Nome</Label>
                  <Input
                    id={`name-${index}`}
                    value={product.name}
                    onChange={(e) => {
                      const newProducts = [...products];
                      newProducts[index].name = e.target.value;
                      setProducts(newProducts);
                    }}
                    placeholder="Nome do produto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`price-${index}`}>Preço (R$)</Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    step="0.01"
                    value={product.price}
                    onChange={(e) => {
                      const newProducts = [...products];
                      newProducts[index].price = parseFloat(e.target.value) || 0;
                      setProducts(newProducts);
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`description-${index}`}>Descrição</Label>
                <Textarea
                  id={`description-${index}`}
                  value={product.description}
                  onChange={(e) => {
                    const newProducts = [...products];
                    newProducts[index].description = e.target.value;
                    setProducts(newProducts);
                  }}
                  placeholder="Descrição do produto"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`image-${index}`}>URL da Imagem</Label>
                <Input
                  id={`image-${index}`}
                  value={product.image_url || ''}
                  onChange={(e) => {
                    const newProducts = [...products];
                    newProducts[index].image_url = e.target.value;
                    setProducts(newProducts);
                  }}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              <Button
                onClick={() => handleSaveProduct(product, index)}
                disabled={loading || !product.name || product.price <= 0}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar Produto
              </Button>
            </CardContent>
          </Card>
        ))}

        {products.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhum produto cadastrado ainda
              </p>
              <Button onClick={handleAddProduct}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Produto
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
