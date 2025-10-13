import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, User, Clock, MessageCircle, Send, Phone, Mail, LogOut, FileText, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { MediaUpload } from "@/components/tickets/MediaUpload";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function TicketsImproved() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    try {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!userRole?.tenant_id) return;

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          contact:contacts(name, phone, avatar_url),
          queue:queues(name, color)
        `)
        .eq("tenant_id", userRole.tenant_id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
      if (data && data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar tickets",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTickets(filtered);
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !mediaUrl) || !selectedTicket || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert([
        {
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          content: messageText.trim() || '[Mídia]',
          is_from_contact: false,
          media_url: mediaUrl,
          media_type: mediaType,
        },
      ]);

      if (error) throw error;

      await supabase
        .from("tickets")
        .update({ 
          last_message: messageText.trim() || '[Mídia enviada]',
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedTicket.id);

      setMessageText("");
      setMediaUrl(null);
      setMediaType(null);
      loadMessages(selectedTicket.id);
      loadTickets();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-500",
      in_progress: "bg-yellow-500",
      pending: "bg-orange-500",
      closed: "bg-gray-500",
    };
    const labels: Record<string, string> = {
      open: "Aberto",
      in_progress: "Atendendo",
      pending: "Pendente",
      closed: "Fechado",
    };
    return <Badge className={`${colors[status]} text-white`}>{labels[status] || status}</Badge>;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card h-14 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Atendimentos</h1>
        </div>
        <Button variant="outline" size="icon" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Lista de Tickets */}
        <div className="w-80 border-r flex flex-col bg-card">
          {/* Filtros e Busca */}
          <div className="p-3 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="open" className="text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Abertos
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {tickets.filter(t => t.status === 'open').length}
                    </Badge>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">
                  Pendentes
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {tickets.filter(t => t.status === 'pending').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="closed" className="text-xs">
                  Fechados
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Lista de Tickets */}
          <div className="flex-1 overflow-y-auto">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedTicket?.id === ticket.id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={ticket.contact?.avatar_url} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    {ticket.status === 'open' && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-sm truncate">
                        {ticket.contact?.name || 'Sem nome'}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(ticket.updated_at), {
                          addSuffix: false,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {ticket.last_message || 'Sem mensagens'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(ticket.status)}
                      {ticket.queue && (
                        <span className="text-xs text-muted-foreground">
                          {ticket.queue.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Área de Chat */}
        {selectedTicket ? (
          <div className="flex-1 flex flex-col">
            {/* Header do Chat */}
            <div className="border-b p-4 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedTicket.contact?.avatar_url} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedTicket.contact?.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {selectedTicket.contact?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedTicket.contact.phone}
                        </span>
                      )}
                      {selectedTicket.contact?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedTicket.contact.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {getStatusBadge(selectedTicket.status)}
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_from_contact ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.is_from_contact
                        ? "bg-white shadow-sm"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {message.media_url && (
                      <div className="mb-2">
                        {message.media_type === 'image' && (
                          <img 
                            src={message.media_url} 
                            alt="Mídia" 
                            className="rounded-lg max-w-full h-auto"
                          />
                        )}
                        {message.media_type === 'audio' && (
                          <audio controls className="w-full">
                            <source src={message.media_url} />
                          </audio>
                        )}
                        {message.media_type === 'document' && (
                          <a 
                            href={message.media_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm underline"
                          >
                            <FileText className="h-4 w-4" />
                            Abrir documento
                          </a>
                        )}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <Clock className="h-3 w-3 opacity-70" />
                      <span className="text-xs opacity-70">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input de Mensagem */}
            <div className="border-t p-4 bg-card">
              {mediaUrl && (
                <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                  <span className="text-sm">Mídia anexada</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMediaUrl(null);
                      setMediaType(null);
                    }}
                  >
                    Remover
                  </Button>
                </div>
              )}
              <div className="flex gap-2 items-end">
                <MediaUpload
                  onMediaSelect={(url, type) => {
                    setMediaUrl(url);
                    setMediaType(type);
                  }}
                />
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="resize-none"
                  rows={1}
                  disabled={selectedTicket.status === "closed"}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || (!messageText.trim() && !mediaUrl) || selectedTicket.status === "closed"}
                  size="icon"
                  className="flex-shrink-0"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Selecione um ticket para iniciar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
