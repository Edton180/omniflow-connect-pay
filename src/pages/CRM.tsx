import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, LogOut, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  position: number;
}

const defaultColumns = [
  { id: "lead", name: "Lead", color: "#94a3b8" },
  { id: "contact", name: "Primeiro Contato", color: "#3b82f6" },
  { id: "proposal", name: "Proposta Enviada", color: "#f59e0b" },
  { id: "negotiation", name: "Negociação", color: "#8b5cf6" },
  { id: "won", name: "Fechado", color: "#10b981" },
];

export default function CRM() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleAddLead = () => {
    const newLead: Lead = {
      id: Date.now().toString(),
      ...formData,
      status: "lead",
      position: leads.filter(l => l.status === "lead").length,
    };
    setLeads([...leads, newLead]);
    setFormData({ name: "", email: "", phone: "" });
    setDialogOpen(false);
  };

  const moveCard = (leadId: string, newStatus: string) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ));
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
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Lista
            </Button>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-5 gap-4">
          {defaultColumns.map(column => (
            <Card key={column.id} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: column.color }}
                  />
                  {column.name}
                  <Badge variant="secondary" className="ml-auto">
                    {leads.filter(l => l.status === column.id).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leads
                  .filter(lead => lead.status === column.id)
                  .map(lead => (
                    <Card key={lead.id} className="p-3 cursor-move hover:shadow-lg transition-shadow">
                      <h4 className="font-semibold text-sm">{lead.name}</h4>
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      <div className="flex gap-1 mt-2">
                        {defaultColumns
                          .filter(col => col.id !== column.id)
                          .slice(0, 2)
                          .map(col => (
                            <Button
                              key={col.id}
                              variant="outline"
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => moveCard(lead.id, col.id)}
                            >
                              {col.name.split(' ')[0]}
                            </Button>
                          ))}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
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
    </div>
  );
}