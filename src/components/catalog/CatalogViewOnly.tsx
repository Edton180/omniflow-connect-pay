import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_active: boolean;
}

export function CatalogViewOnly({ tenantId }: { tenantId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, [tenantId]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Catálogo (Visualização)</h2>
          <p className="text-sm text-muted-foreground">
            Você tem permissão apenas para visualizar os produtos
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            {product.image_url && (
              <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <Badge variant="secondary">
                  R$ {product.price.toFixed(2)}
                </Badge>
              </div>
              {product.description && (
                <CardDescription className="line-clamp-2">
                  {product.description}
                </CardDescription>
              )}
            </CardHeader>
          </Card>
        ))}

        {products.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                Nenhum produto disponível no momento
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
