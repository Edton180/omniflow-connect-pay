import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, LogOut, Search, User, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SuperAdminTickets() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadTenants();
    loadAllTickets();
  }, []);

  useEffect(() => {
    loadAllTickets();
  }, [selectedTenant]);

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadAllTickets = async () => {
    try {
      let query = supabase
        .from("tickets")
        .select(`
          *,
          contact:contacts(name, phone),
          tenant:tenants(name),
          queue:queues(name, color)
        `)
        .order("updated_at", { ascending: false });

      if (selectedTenant !== "all") {
        query = query.eq("tenant_id", selectedTenant);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const filteredTickets = tickets.filter(t =>
    t.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-500",
      in_progress: "bg-yellow-500",
      pending: "bg-orange-500",
      closed: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
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
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Todos os Atendimentos</h1>
              <p className="text-xs text-muted-foreground">Visão global de todas as empresas</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por contato ou empresa..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filtrar por empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {tenants.map(tenant => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/tickets/${ticket.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">
                          {ticket.contact?.name || 'Sem nome'}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {ticket.tenant?.name}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {ticket.last_message || 'Sem mensagens'}
                      </p>
                      {ticket.queue && (
                        <div className="flex items-center gap-1 mt-1">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: ticket.queue.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {ticket.queue.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(ticket.status)} text-white`}>
                    {ticket.status === 'open' ? 'Aberto' : 
                     ticket.status === 'in_progress' ? 'Atendendo' :
                     ticket.status === 'pending' ? 'Pendente' : 'Fechado'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}