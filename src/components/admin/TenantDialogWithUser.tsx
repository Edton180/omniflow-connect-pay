import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface TenantDialogWithUserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: any;
  onSuccess: () => void;
}

export const TenantDialogWithUser = ({ open, onOpenChange, tenant, onSuccess }: TenantDialogWithUserProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    // Tenant info
    name: "",
    slug: "",
    whatsapp: "",
    expiry_date: "",
    plan_id: "",
    logo_url: "",
    primary_color: "#8B5CF6",
    secondary_color: "#3B82F6",
    max_users: 5,
    max_tickets: 100,
    subscription_status: "trial",
    is_active: true,
    // Admin user info
    admin_name: "",
    admin_email: "",
    admin_password: "",
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (tenant) {
      // Format expiry_date for datetime-local input
      let formattedExpiry = "";
      if (tenant.expiry_date) {
        const date = new Date(tenant.expiry_date);
        formattedExpiry = date.toISOString().slice(0, 16);
      }
      
      setFormData({
        name: tenant.name || "",
        slug: tenant.slug || "",
        whatsapp: tenant.whatsapp || "",
        expiry_date: formattedExpiry,
        plan_id: tenant.plan_id || "",
        logo_url: tenant.logo_url || "",
        primary_color: tenant.primary_color || "#8B5CF6",
        secondary_color: tenant.secondary_color || "#3B82F6",
        max_users: tenant.max_users || 5,
        max_tickets: tenant.max_tickets || 100,
        subscription_status: tenant.subscription_status || "trial",
        is_active: tenant.is_active ?? true,
        admin_name: "",
        admin_email: "",
        admin_password: "",
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        whatsapp: "",
        expiry_date: "",
        plan_id: "",
        logo_url: "",
        primary_color: "#8B5CF6",
        secondary_color: "#3B82F6",
        max_users: 5,
        max_tickets: 100,
        subscription_status: "trial",
        is_active: true,
        admin_name: "",
        admin_email: "",
        admin_password: "",
      });
    }
  }, [tenant, open]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenant && (!formData.admin_email || !formData.admin_password)) {
      toast({
        title: "Erro",
        description: "E-mail e senha do usuário responsável são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (tenant) {
        // Update tenant with all fields including whatsapp and expiry_date
        const updateData: any = {
          name: formData.name,
          slug: formData.slug,
          logo_url: formData.logo_url,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          max_users: parseInt(String(formData.max_users)),
          max_tickets: parseInt(String(formData.max_tickets)),
          subscription_status: formData.subscription_status,
          is_active: formData.is_active,
        };

        // Add optional fields if they have values
        if (formData.whatsapp) updateData.whatsapp = formData.whatsapp;
        if (formData.expiry_date) updateData.expiry_date = formData.expiry_date;
        if (formData.plan_id) updateData.plan_id = formData.plan_id;

        const { error } = await supabase
          .from("tenants")
          .update(updateData)
          .eq("id", tenant.id);

        if (error) throw error;

        toast({
          title: "Empresa atualizada",
          description: "A empresa foi atualizada com sucesso.",
        });
      } else {
        // Use Edge Function to create tenant with admin user
        const { data, error } = await supabase.functions.invoke('create-tenant', {
          body: {
            name: formData.name,
            slug: formData.slug,
            logo_url: formData.logo_url,
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color,
            max_users: formData.max_users,
            max_tickets: formData.max_tickets,
            subscription_status: formData.subscription_status,
            is_active: formData.is_active,
            admin_name: formData.admin_name,
            admin_email: formData.admin_email,
            admin_password: formData.admin_password,
          },
        });

        console.log('Edge function response:', data, error);

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(data?.error || error.message || 'Erro ao criar empresa');
        }

        toast({
          title: "Empresa criada",
          description: "A empresa e o usuário responsável foram criados com sucesso.",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving tenant:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name });
    if (!tenant) {
      setFormData(prev => ({ ...prev, slug: generateSlug(name) }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tenant ? "Editar Empresa" : "Cadastrar Empresa"}</DialogTitle>
          <DialogDescription>
            {tenant ? "Atualize as informações da empresa" : "Cadastre uma nova empresa no sistema"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informações</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Nome da empresa"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="55119999999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date">Data/Hora Vencimento</Label>
                <Input
                  id="expiry_date"
                  type="datetime-local"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>

            {plans.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="plan">Plano</Label>
                <Select
                  value={formData.plan_id}
                  onValueChange={(value) => setFormData({ ...formData, plan_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.billing_period === 'yearly' ? 'Anual' : 'Mensal'} - R$ {plan.price?.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status da Assinatura</Label>
              <Select
                value={formData.subscription_status}
                onValueChange={(value) => setFormData({ ...formData, subscription_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="expired">Vencida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!tenant && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Cadastrar Usuário Responsável</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="admin_name">Cadastrar Usuário Responsável</Label>
                  <Input
                    id="admin_name"
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    placeholder="Nome do responsável"
                    required={!tenant}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_email">E-mail *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    placeholder="email@empresa.com"
                    required={!tenant}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_password">Senha *</Label>
                  <Input
                    id="admin_password"
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    placeholder="Senha (mínimo 6 caracteres)"
                    required={!tenant}
                    minLength={6}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};