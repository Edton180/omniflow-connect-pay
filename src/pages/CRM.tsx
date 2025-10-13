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
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!userRole?.tenant_id) return;
      setTenantId(userRole.tenant_id);

      await loadColumns(userRole.tenant_id);
      await loadLeads(userRole.tenant_id);
    } catch (error: any) {
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
    if (!formData.name || !tenantId || columns.length === 0) return;

    try {
      const { error } = await supabase
        .from("crm_leads")
        .insert({
          ...formData,
          tenant_id: tenantId,
          column_id: columns[0].id,
          position: leads.filter(l => l.column_id === columns[0].id).length,
        });

      if (error) throw error;

      setFormData({ name: "", email: "", phone: "" });
      setDialogOpen(false);
      
      toast({
        title: "Lead adicionado",
        description: "O lead foi adicionado com sucesso.",
      });
      
      await loadLeads();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddColumn = async () => {
    if (!columnFormData.name || !tenantId) return;

    try {
      const { error } = await supabase
        .from("crm_columns")
        .insert({
          ...columnFormData,
          tenant_id: tenantId,
          position: columns.length,
        });

      if (error) throw error;

      setColumnFormData({ name: "", color: "#8B5CF6" });
      setColumnDialogOpen(false);
      
      toast({
        title: "Coluna adicionada",
        description: "A coluna foi adicionada com sucesso.",
      });
      
      await loadColumns();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
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
                      className="p-3 cursor-move hover:shadow-lg transition-shadow"
                      draggable
                      onDragStart={() => handleDragStart(lead)}
                    >
                      <h4 className="font-semibold text-sm">{lead.name}</h4>
                      {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                      {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
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
            <Button onClick={handleAddLead} className="w-full">Adicionar Lead</Button>
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
