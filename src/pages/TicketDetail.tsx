import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Send, Paperclip, Phone, Mail, User, Clock, Loader2, X, Trash2, ArrowRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MediaUpload } from "@/components/tickets/MediaUpload";
import { AudioRecorder } from "@/components/chat/AudioRecorder";
import { StickerPicker } from "@/components/chat/StickerPicker";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [forwardTarget, setForwardTarget] = useState<"agent" | "queue" | "bot">("agent");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedQueue, setSelectedQueue] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
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
      // Se houver mídia do storage, criar signed URL
      let publicMediaUrl = mediaUrl;
      if (mediaUrl && mediaUrl.includes('supabase.co/storage')) {
        try {
          const urlParts = mediaUrl.split('/');
          const bucketIndex = urlParts.findIndex(part => part === 'object') + 2;
          const bucket = urlParts[bucketIndex];
          const path = urlParts.slice(bucketIndex + 1).join('/');
          
          const { data: signedData, error: signError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600); // 1 hora
          
          if (!signError && signedData?.signedUrl) {
            publicMediaUrl = signedData.signedUrl;
            console.log("✅ Signed URL criada:", publicMediaUrl);
          }
        } catch (signErr) {
          console.error("⚠️ Erro ao criar signed URL:", signErr);
          // Continua com a URL original se falhar
        }
      }

      // Insert message into database
      const { data: insertedMessage, error: insertError } = await supabase
        .from("messages")
        .insert([
          {
            ticket_id: id,
            sender_id: user.id,
            content: messageText.trim() || "[Mídia]",
            is_from_contact: false,
            media_url: mediaUrl,
            media_type: mediaType,
            status: "sending",
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update ticket's last_message
      await supabase
        .from("tickets")
        .update({ last_message: messageText.trim() || "[Mídia enviada]" })
        .eq("id", id);

      // Send message through the appropriate channel
      if (ticket?.channel === "telegram") {
        const chatId = ticket?.contact?.metadata?.telegram_chat_id;

        if (chatId) {
          try {
            const { data: sendData, error: sendError } = await supabase.functions.invoke(
              "send-telegram-media",
              {
                body: {
                  chatId: String(chatId),
                  message: messageText.trim(),
                  mediaUrl: publicMediaUrl || null,
                  mediaType: mediaType || null,
                  messageId: insertedMessage.id,
                },
              }
            );

            if (sendError || !sendData?.success) {
              console.error("Erro ao enviar:", sendError || sendData);
              await supabase
                .from("messages")
                .update({ status: "failed" })
                .eq("id", insertedMessage.id);
              
              toast({
                title: "Erro ao enviar",
                description: sendError?.message || sendData?.error || "Erro ao enviar mensagem",
                variant: "destructive",
              });
            } else {
              console.log("Mensagem enviada com sucesso");
              toast({
                title: "Mensagem enviada",
                description: "Sua mensagem foi enviada com sucesso.",
              });
            }
          } catch (sendErr: any) {
            console.error("Exceção ao enviar:", sendErr);
            await supabase
              .from("messages")
              .update({ status: "failed" })
              .eq("id", insertedMessage.id);
            
            toast({
              title: "Erro ao enviar",
              description: sendErr.message || "Erro ao enviar mensagem",
              variant: "destructive",
            });
          }
        }
      } else if (ticket?.channel === "whatsapp") {
        // WhatsApp sending logic
        const phoneNumber = ticket?.contact?.phone;
        if (phoneNumber) {
          try {
            const { error: sendError } = await supabase.functions.invoke(
              "send-waba-message",
              {
                body: {
                  to: phoneNumber,
                  message: messageText.trim(),
                  mediaUrl: publicMediaUrl || null,
                  mediaType: mediaType || null,
                },
              }
            );

            if (sendError) {
              console.error("Erro ao enviar WhatsApp:", sendError);
              await supabase
                .from("messages")
                .update({ status: "failed" })
                .eq("id", insertedMessage.id);
              
              toast({
                title: "Erro ao enviar",
                description: sendError.message || "Erro ao enviar mensagem",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Mensagem enviada",
                description: "Sua mensagem foi enviada com sucesso.",
              });
            }
          } catch (sendErr: any) {
            console.error("Exceção ao enviar WhatsApp:", sendErr);
            await supabase
              .from("messages")
              .update({ status: "failed" })
              .eq("id", insertedMessage.id);
            
            toast({
              title: "Erro ao enviar",
              description: sendErr.message || "Erro ao enviar mensagem",
              variant: "destructive",
            });
          }
        }
      }

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

  const handleDeleteTicket = async () => {
    try {
      // Deletar mensagens associadas
      await supabase.from("messages").delete().eq("ticket_id", id);

      // Deletar o ticket
      const { error } = await supabase.from("tickets").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Ticket deletado",
        description: "O ticket e suas mensagens foram removidos com sucesso.",
      });

      navigate("/tickets");
    } catch (error: any) {
      toast({
        title: "Erro ao deletar ticket",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      console.log("🔄 Iniciando mudança de status para:", newStatus);
      console.log("📊 Profile tenant_id:", profile?.tenant_id);
      console.log("🎫 Ticket atual:", ticket);
      
      const updates: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // Add closed_at timestamp when closing ticket
      if (newStatus === "closed") {
        updates.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      // Update local ticket state
      setTicket((prev: any) => ({ ...prev, ...updates }));

      // Send evaluation if status is closed and auto_send_on_close is enabled
      if (newStatus === "closed" && id) {
        console.log("🔐 Ticket fechado, verificando configurações de avaliação...");
        
        try {
          // Get tenant_id from ticket if not available in profile
          const tenantId = profile?.tenant_id || ticket?.tenant_id;
          
          if (!tenantId) {
            console.error("❌ tenant_id não disponível");
            throw new Error("Tenant ID não encontrado");
          }

          console.log("🔍 Buscando configurações de avaliação para tenant:", tenantId);

          const { data: evalSettings, error: evalError } = await supabase
            .from("evaluation_settings")
            .select("*")
            .eq("tenant_id", tenantId)
            .maybeSingle();

          if (evalError) {
            console.error("❌ Erro ao buscar configurações:", evalError);
            throw evalError;
          }

          console.log("📊 Configurações de avaliação:", {
            enabled: evalSettings?.enabled,
            auto_send_on_close: evalSettings?.auto_send_on_close,
            rating_scale: evalSettings?.rating_scale,
            message_template: evalSettings?.message_template
          });

          if (!evalSettings) {
            console.warn("⚠️ Nenhuma configuração de avaliação encontrada");
            return;
          }

          if (!evalSettings.enabled) {
            console.warn("⚠️ Sistema de avaliação desabilitado");
            toast({
              title: "Avaliação desabilitada",
              description: "O sistema de avaliação não está habilitado. Ative-o nas configurações.",
              variant: "default",
            });
            return;
          }

          if (!evalSettings.auto_send_on_close) {
            console.log("ℹ️ Envio automático de avaliação desabilitado");
            return;
          }

          // Get fresh ticket data with contact info
          console.log("🔄 Buscando dados atualizados do ticket...");
          const { data: freshTicket, error: ticketError } = await supabase
            .from("tickets")
            .select(`
              *,
              contact:contacts(*)
            `)
            .eq("id", id)
            .single();

          if (ticketError) {
            console.error("❌ Erro ao buscar ticket:", ticketError);
            throw ticketError;
          }

          if (!freshTicket || !freshTicket.contact) {
            console.error("❌ Ticket ou contato não encontrado");
            toast({
              title: "Erro",
              description: "Não foi possível encontrar os dados do contato para enviar a avaliação.",
              variant: "destructive",
            });
            return;
          }

          console.log("📱 Dados do ticket:", {
            id: freshTicket.id,
            channel: freshTicket.channel,
            contactId: freshTicket.contact.id,
            contactPhone: freshTicket.contact.phone,
            contactName: freshTicket.contact.name,
            metadata: freshTicket.contact.metadata,
          });

          // Get contact identifier based on channel
          const contactMetadata = freshTicket.contact.metadata as any;
          let contactIdentifier: string;
          
          if (freshTicket.channel === "telegram") {
            contactIdentifier = contactMetadata?.telegram_chat_id || freshTicket.contact.phone;
            console.log("📞 Telegram chat_id:", contactIdentifier);
          } else {
            contactIdentifier = freshTicket.contact.phone;
            console.log("📞 WhatsApp phone:", contactIdentifier);
          }

          if (!contactIdentifier) {
            console.error("❌ Identificador do contato não encontrado");
            toast({
              title: "Erro",
              description: `Não foi possível identificar o contato para o canal ${freshTicket.channel}`,
              variant: "destructive",
            });
            return;
          }

          console.log("📤 Enviando avaliação automática...");
          console.log("📦 Payload:", {
            ticketId: freshTicket.id,
            channel: freshTicket.channel,
            contactPhone: contactIdentifier,
            contactId: freshTicket.contact.id,
          });

          const { data: evalResponse, error: sendEvalError } = await supabase.functions.invoke(
            "send-evaluation",
            {
              body: {
                ticketId: freshTicket.id,
                channel: freshTicket.channel,
                contactPhone: contactIdentifier,
                contactId: freshTicket.contact.id,
              },
            }
          );

          if (sendEvalError) {
            console.error("❌ Erro ao enviar avaliação:", sendEvalError);
            toast({
              title: "Aviso",
              description: `Não foi possível enviar a avaliação: ${sendEvalError.message}`,
              variant: "destructive",
            });
          } else if (evalResponse?.error) {
            console.error("❌ Erro na resposta da avaliação:", evalResponse.error);
            toast({
              title: "Aviso",
              description: `Erro ao enviar avaliação: ${evalResponse.error}`,
              variant: "destructive",
            });
          } else {
            console.log("✅ Avaliação enviada com sucesso:", evalResponse);
            toast({
              title: "Avaliação enviada ✓",
              description: "A solicitação de avaliação foi enviada ao cliente.",
            });
          }
        } catch (evalError: any) {
          console.error("❌ Exceção ao enviar avaliação:", evalError);
          toast({
            title: "Erro",
            description: `Erro ao processar avaliação: ${evalError.message}`,
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Status atualizado",
        description: "O status do ticket foi atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error("❌ Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadAgentsAndQueues = async () => {
    if (!profile?.tenant_id) return;

    try {
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

  useEffect(() => {
    if (forwardDialogOpen) {
      loadAgentsAndQueues();
    }
  }, [forwardDialogOpen, profile]);

  const handleForward = async () => {
    if (!id) return;

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
        .eq("id", id);

      if (error) throw error;

      setForwardDialogOpen(false);
      setSelectedAgent("");
      setSelectedQueue("");
      
      toast({
        title: "Ticket encaminhado",
        description: "O ticket foi encaminhado com sucesso.",
      });

      // Reload ticket data
      await fetchTicketData();
    } catch (error: any) {
      toast({
        title: "Erro ao encaminhar",
        description: error.message,
        variant: "destructive",
      });
    }
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
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-lg font-bold">#{ticket.id.slice(0, 8)}</h1>
                  <p className="text-xs text-muted-foreground">{ticket.contact?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {ticket.channel === 'waba' ? 'WhatsApp' : ticket.channel}
                  </Badge>
                  {ticket.queue && (
                    <Badge 
                      style={{ 
                        backgroundColor: ticket.queue.color,
                        color: '#fff'
                      }}
                    >
                      {ticket.queue.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setForwardDialogOpen(true)}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Encaminhar
              </Button>
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Atendimento</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
              <TicketStatusBadge status={ticket.status} />
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
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

      {/* Forward Dialog */}
      <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encaminhar Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Encaminhar para</Label>
              <Select value={forwardTarget} onValueChange={(v) => setForwardTarget(v as "agent" | "queue" | "bot")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="queue">Fila</SelectItem>
                  <SelectItem value="bot">Bot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {forwardTarget === "agent" && (
              <div>
                <Label>Selecionar Agente</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um agente" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {forwardTarget === "queue" && (
              <div>
                <Label>Selecionar Fila</Label>
                <Select value={selectedQueue} onValueChange={setSelectedQueue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma fila" />
                  </SelectTrigger>
                  <SelectContent>
                    {queues.map((queue) => (
                      <SelectItem key={queue.id} value={queue.id}>
                        {queue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {forwardTarget === "bot" && (
              <p className="text-sm text-muted-foreground">
                O ticket será encaminhado para o bot e o fluxo será reiniciado.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForwardDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleForward}>
              Encaminhar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
