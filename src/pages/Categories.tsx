import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, LogOut, FolderOpen, Edit, Trash2, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CategoryDialog } from "@/components/catalog/CategoryDialog";

export default function Categories() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [user]);

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
      await loadCategories(userRole.tenant_id);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
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

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta categoria?")) return;

    try {
      const { error } = await supabase
        .from("catalog_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Categoria removida",
        description: "A categoria foi removida com sucesso.",
      });

      await loadCategories();
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
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Categorias</h1>
              <p className="text-xs text-foreground/60">Organize seus produtos em categorias</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button onClick={() => {
              setEditingCategory(null);
              setDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
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
                Você precisa estar associado a uma empresa para gerenciar categorias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Entre em contato com o administrador do sistema para associar sua conta a uma empresa.
              </p>
              <Button onClick={() => navigate("/dashboard")} className="mt-4">
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : categories.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Nenhuma categoria cadastrada</CardTitle>
              <CardDescription>
                Organize seus produtos em categorias para facilitar a navegação
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <FolderOpen className="h-16 w-16 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Crie categorias como "Pizzas", "Bebidas", "Sobremesas" para organizar seu catálogo
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Categoria
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    {category.image_url && (
                      <img 
                        src={category.image_url} 
                        alt={category.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      {category.description && (
                        <CardDescription className="text-sm">{category.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        tenantId={tenantId || ""}
        onSuccess={loadCategories}
      />
    </div>
  );
}
