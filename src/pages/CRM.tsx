import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, LogOut, Users, Pencil, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function CRM() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [columnFormData, setColumnFormData] = useState({ name: "", color: "#8B5CF6" });
  const [draggedLead, setDraggedLead] = useState<any>(null);
  const [editingLead, setEditingLead] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const leadsChannel = supabase
      .channel('crm_leads_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_leads' },
        () => loadLeads()
      )
      .subscribe();

    const columnsChannel = supabase
      .channel('crm_columns_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_columns' },
        () => loadColumns()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(columnsChannel);
    };
  };

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

      if (roleError) {
        console.error("Error loading user role:", roleError);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do usuário",
          variant: "destructive",
        });
        return;
      }

      if (!userRole?.tenant_id) {
        // Auto-assign tenant if user doesn't have one
        const { data: newTenantId, error: rpcError } = await supabase
          .rpc("auto_assign_tenant", {
            _user_id: user.id,
            _company_name: "Minha Empresa"
          });

        if (rpcError) {
          console.error("Error auto-assigning tenant:", rpcError);
          toast({
            title: "Erro",
            description: "Não foi possível criar empresa automaticamente",
            variant: "destructive",
          });
          return;
        }

        if (newTenantId) {
          setTenantId(newTenantId);
          await Promise.all([
            loadColumns(newTenantId),
            loadLeads(newTenantId)
          ]);
          toast({
            title: "Empresa criada",
            description: "Uma empresa foi criada automaticamente para você. Acesse o CRM agora!",
          });
        }
        return;
      }
      
      setTenantId(userRole.tenant_id);
      await Promise.all([
        loadColumns(userRole.tenant_id),
        loadLeads(userRole.tenant_id)
      ]);
    } catch (error: any) {
      console.error("Error in loadData:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadColumns = async (tid?: string) => {
    const targetTenantId = tid || tenantId;
    if (!targetTenantId) return;

    const { data, error } = await supabase
      .from("crm_columns")
      .select("*")
      .eq("tenant_id", targetTenantId)
      .order("position");

    if (error) throw error;
    setColumns(data || []);
  };

  const loadLeads = async (tid?: string) => {
    const targetTenantId = tid || tenantId;
    if (!targetTenantId) return;

    const { data, error } = await supabase
      .from("crm_leads")
      .select("*")
      .eq("tenant_id", targetTenantId)
      .order("position");

    if (error) throw error;
    setLeads(data || []);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleAddLead = async () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o nome do lead.",
        variant: "destructive",
      });
      return;
    }

    if (!tenantId) {
      toast({
        title: "Erro",
        description: "Tenant não encontrado. Recarregue a página.",
        variant: "destructive",
      });
      return;
    }

    if (columns.length === 0) {
      toast({
        title: "Erro",
        description: "Crie pelo menos uma coluna antes de adicionar leads.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingLead) {
        // Update existing lead
        const { error } = await supabase
          .from("crm_leads")
          .update({
            name: formData.name.trim(),
            email: formData.email?.trim() || null,
            phone: formData.phone?.trim() || null,
          })
          .eq("id", editingLead);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Lead atualizado com sucesso!",
        });
      } else {
        // Create new lead
        const leadData = {
          name: formData.name.trim(),
          email: formData.email?.trim() || null,
          phone: formData.phone?.trim() || null,
          tenant_id: tenantId,
          column_id: columns[0].id,
          position: leads.filter(l => l.column_id === columns[0].id).length,
        };
        
        const { error } = await supabase
          .from("crm_leads")
          .insert(leadData)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Lead adicionado com sucesso!",
        });
      }

      setFormData({ name: "", email: "", phone: "" });
      setEditingLead(null);
      setDialogOpen(false);
      await loadLeads();
    } catch (error: any) {
      toast({
        title: editingLead ? "Erro ao atualizar lead" : "Erro ao adicionar lead",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleAddColumn = async () => {
    if (!columnFormData.name?.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o nome da coluna.",
        variant: "destructive",
      });
      return;
    }

    if (!tenantId) {
      toast({
        title: "Erro",
        description: "Tenant não encontrado. Recarregue a página.",
        variant: "destructive",
      });
      return;
    }

    try {
      const columnData = {
        name: columnFormData.name.trim(),
        color: columnFormData.color,
        tenant_id: tenantId,
        position: columns.length,
      };
      
      const { data, error } = await supabase
        .from("crm_columns")
        .insert(columnData)
        .select()
        .single();

      if (error) throw error;

      setColumnFormData({ name: "", color: "#8B5CF6" });
      setColumnDialogOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Coluna adicionada com sucesso!",
      });
      
      await loadColumns();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar coluna",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (lead: any) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (columnId: string) => {
    if (!draggedLead) return;

    try {
      const { error } = await supabase
        .from("crm_leads")
        .update({ column_id: columnId })
        .eq("id", draggedLead.id);

      if (error) throw error;
      
      await loadLeads();
      setDraggedLead(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      const { error } = await supabase
        .from("crm_columns")
        .delete()
        .eq("id", columnId);

      if (error) throw error;
      
      toast({
        title: "Coluna removida",
        description: "A coluna foi removida com sucesso.",
      });
      
      await loadColumns();
      await loadLeads();
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
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">CRM / Kanban</h1>
              <p className="text-xs text-muted-foreground">Gerencie seus leads e oportunidades</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => setColumnDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Coluna
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lead
            </Button>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(280px, 1fr))` }}>
          {columns.map(column => (
            <Card 
              key={column.id} 
              className="h-fit"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: column.color }}
                  />
                  <span className="flex-1">{column.name}</span>
                  <Badge variant="secondary">
                    {leads.filter(l => l.column_id === column.id).length}
                  </Badge>
                  {columns.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDeleteColumn(column.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leads
                  .filter(lead => lead.column_id === column.id)
                  .map(lead => (
                     <Card 
                      key={lead.id} 
                      className="p-3 cursor-move hover:shadow-lg transition-shadow group"
                      draggable
                      onDragStart={() => handleDragStart(lead)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{lead.name}</h4>
                          {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                          {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ name: lead.name, email: lead.email || "", phone: lead.phone || "" });
                            setEditingLead(lead.id);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setEditingLead(null);
          setFormData({ name: "", email: "", phone: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do lead"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <Button onClick={handleAddLead} className="w-full">
              {editingLead ? "Salvar Alterações" : "Adicionar Lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Coluna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={columnFormData.name}
                onChange={(e) => setColumnFormData({ ...columnFormData, name: e.target.value })}
                placeholder="Nome da coluna"
              />
            </div>
            <div>
              <Label>Cor</Label>
              <Input
                type="color"
                value={columnFormData.color}
                onChange={(e) => setColumnFormData({ ...columnFormData, color: e.target.value })}
              />
            </div>
            <Button onClick={handleAddColumn} className="w-full">Adicionar Coluna</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
