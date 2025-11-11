import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, MessageCircle, Clock, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_COLUMNS = [
  { id: "open", label: "Abertos", color: "bg-green-500" },
  { id: "pending", label: "Pendentes", color: "bg-orange-500" },
  { id: "closed", label: "Fechados", color: "bg-gray-500" },
];

export default function TicketKanban() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadTickets();
    }
  }, [user?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel('tickets-kanban-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          console.log('🔄 Ticket change:', payload);
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadTickets = async () => {
    try {
      if (!user?.id) return;

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!userRole?.tenant_id) return;

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          contact:contacts(*),
          queue:queues(id, name, color),
          assigned_user:profiles!tickets_assigned_to_fkey(id, full_name)
        `)
        .eq("tenant_id", userRole.tenant_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      console.error("Error loading tickets:", error);
      toast({
        title: "Erro ao carregar tickets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTicketClick = (ticket: any) => {
    navigate(`/ticket/${ticket.id}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(t => t.status === status);
  };

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    
    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'closed') {
        updates.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "O ticket foi movido com sucesso.",
      });

      loadTickets();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card h-14 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Kanban de Atendimentos</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {STATUS_COLUMNS.map((column) => {
            const columnTickets = getTicketsByStatus(column.id);
            
            return (
              <div
                key={column.id}
                className="flex-1 min-w-[320px] flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="bg-card rounded-t-lg border-t border-x p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${column.color}`} />
                    <h3 className="font-semibold">{column.label}</h3>
                  </div>
                  <Badge variant="secondary">{columnTickets.length}</Badge>
                </div>

                {/* Column Content */}
                <div className="flex-1 bg-muted/30 rounded-b-lg border-b border-x p-2 overflow-y-auto space-y-2">
                  {columnTickets.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      Nenhum ticket
                    </div>
                  ) : (
                    columnTickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                        onClick={() => handleTicketClick(ticket)}
                        className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] bg-card"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={ticket.contact?.avatar_url} />
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-semibold text-sm truncate">
                                  {ticket.contact?.name}
                                </h4>
                                {ticket.channel && (
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {ticket.channel}
                                  </Badge>
                                )}
                              </div>
                              
                              {ticket.last_message && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {ticket.last_message}
                                </p>
                              )}

                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatDistanceToNow(new Date(ticket.created_at), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                                </span>
                              </div>

                              {ticket.queue && (
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  {ticket.queue.name}
                                </Badge>
                              )}

                              {ticket.assigned_user && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span>{ticket.assigned_user.full_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
