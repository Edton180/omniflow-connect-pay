import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Search, Plus, MessageSquare, Clock, User, Trash2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NewTicketDialog } from "./NewTicketDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const TicketList = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [ticketToForward, setTicketToForward] = useState<any>(null);
  const [forwardTarget, setForwardTarget] = useState<"agent" | "queue" | "bot">("agent");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedQueue, setSelectedQueue] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("tickets")
        .select(`
          *,
          contact:contacts(name, phone, email),
          queue:queues(name, color),
          assigned:profiles(full_name)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar tickets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  // Realtime subscription for tickets
  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          console.log('Ticket change:', payload);
          // Refresh tickets on any change
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", label: string }> = {
      open: { variant: "default", label: "Aberto" },
      in_progress: { variant: "secondary", label: "Em Atendimento" },
      pending: { variant: "secondary", label: "Pendente" },
      resolved: { variant: "default", label: "Resolvido" },
      closed: { variant: "destructive", label: "Fechado" },
    };

    const config = variants[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500",
      medium: "bg-yellow-500",
      high: "bg-red-500",
    };

    return (
      <Badge className={colors[priority] || "bg-gray-500"}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;

    try {
      // Deletar mensagens associadas
      await supabase.from("messages").delete().eq("ticket_id", ticketToDelete);

      // Deletar o ticket
      const { error } = await supabase.from("tickets").delete().eq("id", ticketToDelete);

      if (error) throw error;

      toast({
        title: "Ticket deletado",
        description: "O ticket e suas mensagens foram removidos com sucesso.",
      });

      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar ticket",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
    }
  };

  const loadAgentsAndQueues = async () => {
    if (!user) return;

    try {
      // Buscar tenant_id do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) return;

      // Load agents
      const { data: agentsData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("tenant_id", profile.tenant_id)
        .order("full_name");

      if (agentsData) setAgents(agentsData);

      // Load queues
      const { data: queuesData } = await supabase
        .from("queues")
        .select("id, name")
        .eq("tenant_id", profile.tenant_id)
        .eq("is_active", true)
        .order("name");

      if (queuesData) setQueues(queuesData);
    } catch (error: any) {
      console.error("Error loading agents/queues:", error);
    }
  };

  const handleForward = async () => {
    if (!ticketToForward) return;

    try {
      const updates: any = {};

      if (forwardTarget === "agent" && selectedAgent) {
        updates.assigned_to = selectedAgent;
      } else if (forwardTarget === "queue" && selectedQueue) {
        updates.queue_id = selectedQueue;
        updates.assigned_to = null;
      } else if (forwardTarget === "bot") {
        updates.assigned_to = null;
        updates.status = "open";
        updates.bot_state = { step: "initial" };
      }

      const { error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", ticketToForward.id);

      if (error) throw error;

      setForwardDialogOpen(false);
      setTicketToForward(null);
      setSelectedAgent("");
      setSelectedQueue("");
      
      toast({
        title: "Ticket encaminhado",
        description: "O ticket foi encaminhado com sucesso.",
      });

      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Erro ao encaminhar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.contact?.name?.toLowerCase().includes(search.toLowerCase()) ||
    ticket.contact?.phone?.includes(search) ||
    ticket.last_message?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou mensagem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="in_progress">Em Atendimento</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ticket
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum ticket encontrado</p>
            <p className="text-sm text-muted-foreground">
              {search ? "Tente ajustar sua busca" : "Crie seu primeiro ticket"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="gradient-card hover-scale"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div 
                    className="space-y-1 flex-1 cursor-pointer"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-muted-foreground">#{ticket.id.slice(0, 8)}</span>
                      {ticket.contact?.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      {ticket.channel}
                      {ticket.contact?.phone && (
                        <>
                          <span>•</span>
                          {ticket.contact.phone}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(ticket.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTicketToForward(ticket);
                          setForwardDialogOpen(true);
                          loadAgentsAndQueues();
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTicketToDelete(ticket.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.last_message && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ticket.last_message}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {ticket.queue && (
                        <Badge 
                          className="flex items-center gap-1"
                          style={{ 
                            backgroundColor: ticket.queue.color,
                            color: '#ffffff'
                          }}
                        >
                          {ticket.queue.name}
                        </Badge>
                      )}
                      {ticket.assigned && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          {ticket.assigned.full_name}
                        </div>
                      )}
                    </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewTicketDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este ticket? Esta ação não pode ser desfeita e todas as mensagens associadas também serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTicket} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Encaminhamento */}
      <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encaminhar Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Encaminhar para:</Label>
              <Select value={forwardTarget} onValueChange={(v: "agent" | "queue" | "bot") => setForwardTarget(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="queue">Fila</SelectItem>
                  <SelectItem value="bot">Bot (Reiniciar Atendimento)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {forwardTarget === "agent" && (
              <div>
                <Label>Selecione um agente:</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um agente" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>{agent.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {forwardTarget === "queue" && (
              <div>
                <Label>Selecione uma fila:</Label>
                <Select value={selectedQueue} onValueChange={setSelectedQueue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma fila" />
                  </SelectTrigger>
                  <SelectContent>
                    {queues.map((queue) => (
                      <SelectItem key={queue.id} value={queue.id}>{queue.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {forwardTarget === "bot" && (
              <p className="text-sm text-muted-foreground">
                O ticket será desatribuído e retornará ao início do fluxo do bot.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForwardDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleForward} disabled={
              (forwardTarget === "agent" && !selectedAgent) ||
              (forwardTarget === "queue" && !selectedQueue)
            }>
              Encaminhar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
