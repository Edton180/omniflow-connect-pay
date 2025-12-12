import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, User, MessageCircle, ChevronLeft, ChevronRight, X, RefreshCw, Download, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 20;

export default function SuperAdminTickets() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    loadAllTickets();
  }, [selectedTenant, selectedStatus, currentPage]);

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
    setLoading(true);
    try {
      let query = supabase
        .from("tickets")
        .select(`
          *,
          contact:contacts(name, phone),
          tenant:tenants(name),
          queue:queues(name, color),
          messages:messages(count)
        `, { count: 'exact' })
        .order("updated_at", { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (selectedTenant !== "all") {
        query = query.eq("tenant_id", selectedTenant);
      }

      if (selectedStatus !== "all") {
        query = query.eq("status", selectedStatus);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setTickets(data || []);
      setTotalCount(count || 0);
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

  const handleCloseTicket = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'closed' })
        .eq('id', ticketId);

      if (error) throw error;
      toast({ title: "Ticket fechado com sucesso" });
      loadAllTickets();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: "Aberto",
      in_progress: "Atendendo",
      pending: "Pendente",
      closed: "Fechado",
    };
    return labels[status] || status;
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const exportToCSV = () => {
    const headers = ['Contato', 'Empresa', 'Status', 'Fila', 'Última Atualização'];
    const rows = filteredTickets.map(t => [
      t.contact?.name || 'Sem nome',
      t.tenant?.name || '',
      getStatusLabel(t.status),
      t.queue?.name || '',
      new Date(t.updated_at).toLocaleString('pt-BR')
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: "Exportado com sucesso" });
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Todos os Atendimentos</h1>
              <p className="text-sm text-muted-foreground">
                {totalCount} tickets no total
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadAllTickets()}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
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
          
          <Select value={selectedTenant} onValueChange={(v) => { setSelectedTenant(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[200px]">
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

          <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="open">Aberto</SelectItem>
              <SelectItem value="in_progress">Atendendo</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="closed">Fechado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map((ticket) => (
              <Card 
                key={ticket.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
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
                        <div className="flex items-center gap-3 mt-1">
                          {ticket.queue && (
                            <div className="flex items-center gap-1">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: ticket.queue.color }}
                              />
                              <span className="text-xs text-muted-foreground">
                                {ticket.queue.name}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(ticket.updated_at).toLocaleString('pt-BR', { 
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(ticket.status)} text-white`}>
                        {getStatusLabel(ticket.status)}
                      </Badge>
                      {ticket.status !== 'closed' && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleCloseTicket(ticket.id, e)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredTickets.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhum ticket encontrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}