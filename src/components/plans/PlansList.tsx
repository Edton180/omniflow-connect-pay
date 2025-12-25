import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlanDialog } from "./PlanDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/hooks/useLanguage";

export function PlansList() {
  const { t } = useLanguage();
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
      toast.error(t('errors.loadError'));
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
      toast.success(t('plans.planDeleted'));
      fetchPlans();
    } catch (error: any) {
      console.error("Error deleting plan:", error);
      toast.error(t('errors.deleteError'));
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  if (loading) {
    return (
      <Card className="gradient-card">
        <CardContent className="py-12">
          <div className="text-center">{t('common.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  if (plans.length === 0) {
    return (
      <>
        <Card className="gradient-card">
          <CardHeader>
            <CardTitle>{t('plans.subscriptions')}</CardTitle>
            <CardDescription>
              {t('plans.createManage')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('plans.noPlans')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('plans.createFirst')}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                {t('plans.createFirstPlan')}
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
          <h2 className="text-2xl font-bold">{t('plans.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('plans.subtitle')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {t('common.add')}
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
                <div className="text-sm text-muted-foreground">{t('common.perMonth')}</div>
              </div>

              <div className="space-y-2 text-sm">
                {plan.max_users && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('common.users')}:</span>
                    <span className="font-medium">{plan.max_users}</span>
                  </div>
                )}
                {plan.max_tickets && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('common.connections')}:</span>
                    <span className="font-medium">{plan.max_tickets}</span>
                  </div>
                )}
              </div>

              {plan.features && typeof plan.features === 'object' && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">{t('common.resources')}:</div>
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
                  {t('common.edit')}
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
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('plans.deleteConfirm')} "{planToDelete?.name}"? {t('plans.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}