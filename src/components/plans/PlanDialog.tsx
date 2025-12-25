import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: any | null;
  onSuccess: () => void;
}

export function PlanDialog({ open, onOpenChange, plan, onSuccess }: PlanDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    billing_period: "monthly",
    max_users: "",
    max_tickets: "",
    num_connections: "",
    user_limit: "",
    ticket_limit: "",
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || "",
        description: plan.description || "",
        price: plan.price?.toString() || "",
        billing_period: plan.billing_period || "monthly",
        max_users: plan.max_users?.toString() || "",
        max_tickets: plan.max_tickets?.toString() || "",
        num_connections: plan.features?.num_connections?.toString() || "",
        user_limit: plan.features?.user_limit?.toString() || "",
        ticket_limit: plan.features?.ticket_limit?.toString() || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        billing_period: "monthly",
        max_users: "",
        max_tickets: "",
        num_connections: "",
        user_limit: "",
        ticket_limit: "",
      });
    }
  }, [plan]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price) {
      toast({
        title: t('common.error'),
        description: t('plans.nameAndPriceRequired'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const planData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        billing_period: formData.billing_period,
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
        max_tickets: formData.max_tickets ? parseInt(formData.max_tickets) : null,
        features: {
          num_connections: formData.num_connections ? parseInt(formData.num_connections) : null,
          user_limit: formData.user_limit ? parseInt(formData.user_limit) : null,
          ticket_limit: formData.ticket_limit ? parseInt(formData.ticket_limit) : null,
        },
        currency: "BRL",
        is_active: true,
        tenant_id: null,
      };

      if (plan) {
        const { error } = await supabase
          .from("plans")
          .update(planData)
          .eq("id", plan.id);

        if (error) throw error;

        toast({
          title: t('plans.planUpdated'),
          description: t('plans.planUpdatedSuccess'),
        });
      } else {
        const { error } = await supabase
          .from("plans")
          .insert(planData);

        if (error) throw error;

        toast({
          title: t('plans.planCreated'),
          description: t('plans.planCreatedSuccess'),
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan ? t('plans.editPlan') : t('plans.newPlan')}</DialogTitle>
          <DialogDescription>
            {t('plans.planDetails')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('plans.name')} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('plans.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('plans.price')} (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="99.90"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('plans.billingPeriod')}</Label>
            <Select
              value={formData.billing_period}
              onValueChange={(value) => setFormData({ ...formData, billing_period: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{t('common.monthly')}</SelectItem>
                <SelectItem value="yearly">{t('common.yearly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('plans.description')}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('plans.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('plans.maxUsers')}</Label>
                <Input
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                  placeholder={t('common.unlimited')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('plans.maxTickets')}</Label>
                <Input
                  type="number"
                  value={formData.max_tickets}
                  onChange={(e) => setFormData({ ...formData, max_tickets: e.target.value })}
                  placeholder={t('common.unlimited')}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">{t('plans.additionalLimits')}</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('plans.numConnections')}</Label>
                  <Input
                    type="number"
                    value={formData.num_connections}
                    onChange={(e) => setFormData({ ...formData, num_connections: e.target.value })}
                    placeholder="Ex: 5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('plans.userLimit')}</Label>
                  <Input
                    type="number"
                    value={formData.user_limit}
                    onChange={(e) => setFormData({ ...formData, user_limit: e.target.value })}
                    placeholder="Ex: 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('plans.ticketLimit')}</Label>
                  <Input
                    type="number"
                    value={formData.ticket_limit}
                    onChange={(e) => setFormData({ ...formData, ticket_limit: e.target.value })}
                    placeholder="Ex: 100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? t('common.saving') : plan ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}