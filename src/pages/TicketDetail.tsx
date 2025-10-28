import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Send, Paperclip, Phone, Mail, User, Clock, Loader2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MediaUpload } from "@/components/tickets/MediaUpload";
import { AudioRecorder } from "@/components/chat/AudioRecorder";
import { StickerPicker } from "@/components/chat/StickerPicker";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTicketData = async () => {
    setLoading(true);
    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select(`
          *,
          contact:contacts(name, phone, email, avatar_url),
          queue:queues(name, color),
          assigned:profiles(full_name, avatar_url)
        `)
        .eq("id", id)
        .single();

      if (ticketError) throw ticketError;
      setTicket(ticketData);

      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      scrollToBottom();
    } catch (error: any) {
      toast({
        title: "Erro ao carregar ticket",
        description: error.message,
        variant: "destructive",
      });
      navigate("/tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTicketData();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Realtime subscription for messages and ticket updates
  useEffect(() => {
    if (!id) return;

    console.log('🔌 Configurando subscrição realtime para ticket:', id);

    const messagesChannel = supabase
      .channel(`messages-${id}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `ticket_id=eq.${id}`,
        },
        (payload) => {
          console.log('✅ Nova mensagem recebida:', payload.new);
          setMessages((prev) => {
            // Evita duplicatas
            if (prev.some(msg => msg.id === payload.new.id)) {
              return prev;
            }
            return [...prev, payload.new];
          });
          setTimeout(scrollToBottom, 100);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `ticket_id=eq.${id}`,
        },
        (payload) => {
          console.log('🔄 Mensagem atualizada:', payload.new);
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
          );
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscrição de mensagens:', status);
      });

    const ticketChannel = supabase
      .channel(`ticket-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log('🎫 Ticket atualizado:', payload.new);
          setTicket((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscrição de ticket:', status);
      });

    return () => {
      console.log('🔌 Removendo subscrições realtime');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(ticketChannel);
    };
  }, [id]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!messageText.trim() && !mediaUrl) || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert([
        {
          ticket_id: id,
          sender_id: user.id,
          content: messageText.trim() || "[Mídia]",
          is_from_contact: false,
          media_url: mediaUrl,
          media_type: mediaType,
        },
      ]);

      if (error) throw error;

      // Update ticket's last_message
      await supabase
        .from("tickets")
        .update({ last_message: messageText.trim() || "[Mídia enviada]" })
        .eq("id", id);

      setMessageText("");
      setMediaUrl(null);
      setMediaType(null);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "closed") {
        updates.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setTicket({ ...ticket, ...updates });
      toast({
        title: "Status atualizado",
        description: "O status do ticket foi atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/tickets")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold">#{ticket.id.slice(0, 8)}</h1>
                <p className="text-xs text-muted-foreground">{ticket.contact?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Atendimento</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
              {getStatusBadge(ticket.status)}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-200px)]">
          <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_from_contact ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.is_from_contact
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.is_from_contact ? "text-muted-foreground" : "opacity-70"
                          }`}
                        >
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <MediaUpload onMediaSelect={(url, type) => {
                    setMediaUrl(url);
                    setMediaType(type);
                  }} />
                  <StickerPicker onStickerSelect={(sticker) => setMessageText(messageText + sticker)} />
                  <AudioRecorder onAudioRecorded={(url) => {
                    setMediaUrl(url);
                    setMediaType("audio");
                  }} />
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    disabled={sending || ticket.status === "closed"}
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button type="submit" disabled={sending || (!messageText.trim() && !mediaUrl) || ticket.status === "closed"}>
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Contact Info */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="text-base">Informações do Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={ticket.contact?.avatar_url} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{ticket.contact?.name}</p>
                  <p className="text-xs text-muted-foreground">{ticket.channel}</p>
                </div>
              </div>
              {ticket.contact?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {ticket.contact.phone}
                </div>
              )}
              {ticket.contact?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {ticket.contact.email}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ticket Info */}
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle className="text-base">Detalhes do Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Criado em</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(ticket.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
              </div>
              {ticket.queue && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fila</span>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ticket.queue.color }}
                    />
                    {ticket.queue.name}
                  </div>
                </div>
              )}
              {ticket.assigned && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Responsável</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={ticket.assigned.avatar_url} />
                      <AvatarFallback>
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    {ticket.assigned.full_name}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Prioridade</span>
                <Badge>
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
