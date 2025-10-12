import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlanDialog } from "./PlanDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function PlansList() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      toast.error("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedPlan(null);
    setDialogOpen(true);
  };

  const handleEdit = (plan: any) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleDeleteClick = (plan: any) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!planToDelete) return;

    try {
      const { error } = await supabase
        .from("plans")
        .delete()
        .eq("id", planToDelete.id);

      if (error) throw error;
      toast.success("Plano excluído com sucesso!");
      fetchPlans();
    } catch (error: any) {
      console.error("Error deleting plan:", error);
      toast.error("Erro ao excluir plano");
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  if (loading) {
    return (
      <Card className="gradient-card">
        <CardContent className="py-12">
          <div className="text-center">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (plans.length === 0) {
    return (
      <>
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle>Planos e Assinaturas</CardTitle>
            <CardDescription>
              Crie e gerencie planos de assinatura para seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum plano criado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie seu primeiro plano de assinatura
              </p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </div>
          </CardContent>
        </Card>
        <PlanDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          plan={selectedPlan}
          onSuccess={fetchPlans}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Planos</h2>
          <p className="text-sm text-muted-foreground">Gerencie os planos de assinatura</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="gradient-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.description && (
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold text-primary">
                  R$ {plan.price?.toFixed(2) || "0.00"}
                </div>
                <div className="text-sm text-muted-foreground">por mês</div>
              </div>

              <div className="space-y-2 text-sm">
                {plan.max_users && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usuários:</span>
                    <span className="font-medium">{plan.max_users}</span>
                  </div>
                )}
                {plan.max_tickets && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conexões:</span>
                    <span className="font-medium">{plan.max_tickets}</span>
                  </div>
                )}
              </div>

              {plan.features && typeof plan.features === 'object' && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Recursos:</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(plan.features).map(([key, value]) => 
                      value ? (
                        <span key={key} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {key}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(plan)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(plan)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={selectedPlan}
        onSuccess={fetchPlans}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano "{planToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}