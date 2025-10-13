import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, LogOut, ShoppingBag, Edit, Trash2, FolderOpen, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProductVariationsDialog } from "@/components/catalog/ProductVariationsDialog";
import { ProductOptionalsDialog } from "@/components/catalog/ProductOptionalsDialog";

export default function Catalog() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [variationsDialogOpen, setVariationsDialogOpen] = useState(false);
  const [optionalsDialogOpen, setOptionalsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    image_url: "",
    category_id: "",
    preparation_time: "",
    highlight: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!user?.id) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) throw roleError;

      if (!userRole?.tenant_id) {
        toast({
          title: "Erro",
          description: "Você precisa estar associado a uma empresa",
          variant: "destructive",
        });
        return;
      }

      setTenantId(userRole.tenant_id);
      await Promise.all([
        loadProducts(userRole.tenant_id),
        loadCategories(userRole.tenant_id)
      ]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadProducts = async (tid?: string) => {
    const targetTenantId = tid || tenantId;
    if (!targetTenantId) return;

    const { data, error } = await supabase
      .from("catalog_products")
      .select("*")
      .eq("tenant_id", targetTenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setProducts(data || []);
  };

  const loadCategories = async (tid?: string) => {
    const targetTenantId = tid || tenantId;
    if (!targetTenantId) return;

    const { data, error } = await supabase
      .from("catalog_categories")
      .select("*")
      .eq("tenant_id", targetTenantId)
      .order("position", { ascending: true });

    if (error) throw error;
    setCategories(data || []);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSave = async () => {
    if (!formData.name?.trim() || !formData.price) {
      toast({
        title: "Erro",
        description: "Preencha nome e preço do produto",
        variant: "destructive",
      });
      return;
    }

    if (!tenantId) {
      toast({
        title: "Erro",
        description: "Tenant não encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        image_url: formData.image_url?.trim() || null,
        category_id: formData.category_id || null,
        preparation_time: parseInt(formData.preparation_time) || 0,
        highlight: formData.highlight,
        tenant_id: tenantId,
        is_active: true,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("catalog_products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from("catalog_products")
          .insert(productData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Produto adicionado com sucesso!",
        });
      }

      setFormData({ 
        name: "", 
        description: "", 
        price: "", 
        stock_quantity: "", 
        image_url: "",
        category_id: "",
        preparation_time: "",
        highlight: false,
      });
      setEditingProduct(null);
      setDialogOpen(false);
      await loadProducts();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock_quantity: product.stock_quantity?.toString() || "0",
      image_url: product.image_url || "",
      category_id: product.category_id || "",
      preparation_time: product.preparation_time?.toString() || "0",
      highlight: product.highlight || false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("catalog_products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Produto removido",
        description: "O produto foi removido com sucesso.",
      });

      await loadProducts();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white shadow-glow">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Catálogo de Produtos</h1>
              <p className="text-xs text-foreground/60">Gerencie seus produtos online</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => navigate("/categories")}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Categorias
            </Button>
            <Button onClick={() => {
              setEditingProduct(null);
              setFormData({ 
                name: "", 
                description: "", 
                price: "", 
                stock_quantity: "", 
                image_url: "",
                category_id: "",
                preparation_time: "",
                highlight: false,
              });
              setDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!tenantId ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Acesso Restrito</CardTitle>
              <CardDescription>
                Você precisa estar associado a uma empresa para gerenciar o catálogo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Entre em contato com o administrador do sistema para associar sua conta a uma empresa.
              </p>
              <Button 
                onClick={() => navigate("/dashboard")} 
                className="mt-4"
              >
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Nenhum produto cadastrado</CardTitle>
              <CardDescription>
                Comece adicionando seu primeiro produto ao catálogo
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <ShoppingBag className="h-16 w-16 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Cadastre produtos com nome, descrição, preço e imagens para começar a vender online
              </p>
              <Button onClick={() => {
                setEditingProduct(null);
                setFormData({ 
                  name: "", 
                  description: "", 
                  price: "", 
                  stock_quantity: "", 
                  image_url: "",
                  category_id: "",
                  preparation_time: "",
                  highlight: false,
                });
                setDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Produto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
            <Card key={product.id}>
              {product.image_url && (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                {product.description && (
                  <CardDescription>{product.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    R$ {parseFloat(product.price).toFixed(2)}
                  </span>
                  <span className="text-sm text-foreground/60">
                    Estoque: {product.stock_quantity}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1" 
                    onClick={() => {
                      setSelectedProduct(product);
                      setVariationsDialogOpen(true);
                    }}
                  >
                    <Settings className="mr-1 h-3 w-3" />
                    Variações
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedProduct(product);
                      setOptionalsDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Opcionais
                  </Button>
                </div>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1" onClick={() => handleEdit(product)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do produto"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do produto"
                rows={3}
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Quantidade em Estoque</Label>
                <Input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label>URL da Imagem</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tempo de Preparo (min)</Label>
                <Input
                  type="number"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="highlight"
                    checked={formData.highlight}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, highlight: checked as boolean })
                    }
                  />
                  <Label htmlFor="highlight" className="cursor-pointer">
                    Destacar produto
                  </Label>
                </div>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editingProduct ? "Atualizar Produto" : "Adicionar Produto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedProduct && (
        <>
          <ProductVariationsDialog
            open={variationsDialogOpen}
            onOpenChange={setVariationsDialogOpen}
            productId={selectedProduct.id}
            productName={selectedProduct.name}
          />
          <ProductOptionalsDialog
            open={optionalsDialogOpen}
            onOpenChange={setOptionalsDialogOpen}
            productId={selectedProduct.id}
            productName={selectedProduct.name}
          />
        </>
      )}
    </div>
  );
}
