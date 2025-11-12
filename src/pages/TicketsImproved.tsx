import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, User, Clock, MessageCircle, Send, Phone, Mail, LogOut, FileText, Paperclip, Loader2, Check, CheckCheck, X, Trash2, ArrowRight, RefreshCw, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { MediaUpload } from "@/components/tickets/MediaUpload";
import { AudioRecorder } from "@/components/chat/AudioRecorder";
import { StickerPicker } from "@/components/chat/StickerPicker";
import { QuickReplies } from "@/components/tickets/QuickReplies";
import { TagsManager } from "@/components/contacts/TagsManager";
import { useNotifications } from "@/hooks/useNotifications";
import { TicketNotifications } from "@/components/tickets/TicketNotifications";
import { TicketPriorityIndicator } from "@/components/tickets/TicketPriorityIndicator";
import { TicketTimer } from "@/components/tickets/TicketTimer";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TicketsImproved() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user, profile } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [forwardTarget, setForwardTarget] = useState<"agent" | "queue" | "bot">("agent");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedQueue, setSelectedQueue] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [queueFilter, setQueueFilter] = useState<string>("all");
  const [userTenantId, setUserTenantId] = useState<string>("");
  const [tenant, setTenant] = useState<any>(null);
  const [isSignatureEnabled, setIsSignatureEnabled] = useState(false);
  const [canToggleSignature, setCanToggleSignature] = useState(true);

  // Enable push notifications
  useNotifications();

  useEffect(() => {
    console.log("TicketsImproved montado, user:", user?.id);
    if (user?.id) {
      loadTickets();
      loadQueues();
      fetchTenantConfig();
    }
  }, [user?.id]);

  // Handle ticket selection from navigation state
  useEffect(() => {
    if (location.state?.ticketId && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === location.state.ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
      }
    }
  }, [location.state, tickets]);

  useEffect(() => {
    console.log("Filtros mudaram - tickets:", tickets.length, "filter:", statusFilter, "queueFilter:", queueFilter, "search:", searchTerm);
    filterTickets();
  }, [tickets, searchTerm, statusFilter, queueFilter]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  // Realtime subscription for tickets
  useEffect(() => {
    if (!user?.id) return;
    
    console.log('🔌 Configurando subscrição realtime de tickets');
    
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        async (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          console.log('🔄 Ticket change detectado:', {
            event: payload.eventType,
            ticketId: newData?.id || oldData?.id,
            status: newData?.status || oldData?.status,
          });
          
          // Reload tickets to get fresh data
          await loadTickets();
          
          // Pequeno delay para garantir que o estado foi atualizado
          setTimeout(() => {
            console.log('🔍 Re-aplicando filtros após mudança de ticket');
            filterTickets();
          }, 200);
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscrição de tickets:', status);
      });

    return () => {
      console.log('🔌 Removendo subscrição de tickets');
      supabase.removeChannel(channel);
    };
  }, [user?.id, statusFilter, queueFilter, searchTerm]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedTicket?.id) return;

    console.log('🔌 Configurando subscrição realtime para ticket:', selectedTicket.id);

    const channel = supabase
      .channel(`messages-${selectedTicket.id}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
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
          // Auto scroll para nova mensagem
          setTimeout(() => {
            const chatArea = document.getElementById('chat-messages');
            if (chatArea) {
              chatArea.scrollTop = chatArea.scrollHeight;
            }
          }, 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        },
        (payload) => {
          console.log('🔄 Mensagem atualizada:', payload.new);
          setMessages((prev) => 
            prev.map((msg) => msg.id === payload.new.id ? payload.new : msg)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        },
        (payload) => {
          console.log('🗑️ Mensagem deletada:', payload.old);
          setMessages((prev) => 
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscrição:', status);
      });

    return () => {
      console.log('🔌 Removendo subscrição realtime');
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id]);

  const loadTickets = async () => {
    try {
      if (!user?.id) {
        console.log("Usuário não autenticado");
        return;
      }

      console.log("Carregando tickets para user:", user.id);

      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("User role:", userRole, "Error:", roleError);

      if (!userRole?.tenant_id) {
      console.log("Sem tenant_id");
        return;
      }

      setUserTenantId(userRole.tenant_id);

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          contact:contacts(name, phone, avatar_url, metadata, tags),
          queue:queues(id, name, color)
        `)
        .eq("tenant_id", userRole.tenant_id)
        .order("updated_at", { ascending: false });

      console.log("Tickets carregados:", data?.length, "Error:", error);
      console.log("Exemplo de ticket com fila:", data?.find(t => t.queue_id)?.queue);

      if (error) throw error;
      
      setTickets(data || []);
      console.log("Estado tickets atualizado:", data?.length);
      
      if (data && data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (error: any) {
      console.error("Erro ao carregar tickets:", error);
      toast({
        title: "Erro ao carregar tickets",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filterTickets = () => {
    console.log("🔍 Filtrando tickets:", {
      totalTickets: tickets.length,
      statusFilter,
      queueFilter,
      searchTerm
    });

    // Criar nova array para forçar re-render
    let filtered = [...tickets];

    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
      console.log(`✅ Filtrados por status ${statusFilter}:`, filtered.length);
    }

    if (queueFilter !== "all") {
      filtered = filtered.filter(t => t.queue_id === queueFilter);
      console.log(`✅ Filtrados por fila ${queueFilter}:`, filtered.length);
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    console.log("📋 Tickets filtrados finais:", filtered.length);
    setFilteredTickets(filtered);
  };

  const loadQueues = async () => {
    try {
      if (!user?.id) return;

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!userRole?.tenant_id) return;

      const { data, error } = await supabase
        .from("queues")
        .select("*")
        .eq("tenant_id", userRole.tenant_id)
        .eq("is_active", true);

      if (error) throw error;
      setQueues(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar filas:", error);
    }
  };

  const fetchTenantConfig = async () => {
    try {
      if (!profile?.tenant_id) return;
      
      const { data, error } = await supabase
        .from("tenants")
        .select("allow_agent_signature, force_agent_signature")
        .eq("id", profile.tenant_id)
        .single();
      
      if (error) throw error;

      setTenant(data);
      
      // Se force_agent_signature estiver ativo, força assinatura e desabilita toggle
      if (data?.force_agent_signature) {
        setIsSignatureEnabled(true);
        setCanToggleSignature(false);
      } else {
        setCanToggleSignature(true);
      }
    } catch (error: any) {
      console.error("Erro ao buscar configuração do tenant:", error);
    }
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
      // Adicionar assinatura do agente se habilitado
      let finalMessage = messageText.trim();
      if (isSignatureEnabled && profile?.full_name) {
        finalMessage = finalMessage ? `${finalMessage}\n\n— ${profile.full_name}` : `— ${profile.full_name}`;
      }

      // Insert message into database primeiro para obter o ID
      const { data: insertedMessage, error: insertError } = await supabase
        .from("messages")
        .insert([
          {
            ticket_id: selectedTicket.id,
            sender_id: user.id,
            content: finalMessage || '[Mídia]',
            is_from_contact: false,
            media_url: mediaUrl,
            media_type: mediaType,
            status: 'sending',
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update ticket
      await supabase
        .from("tickets")
        .update({ 
          last_message: finalMessage || '[Mídia enviada]',
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedTicket.id);

      // Send message through the appropriate channel
      if (selectedTicket.channel === 'telegram') {
        const chatId = selectedTicket.contact?.metadata?.telegram_chat_id;
        
        console.log('🔵 Telegram send attempt:', {
          chatId,
          messageId: insertedMessage.id,
          hasMedia: !!mediaUrl,
          mediaType,
          messageText: messageText.trim(),
          contactMetadata: selectedTicket.contact?.metadata
        });
        
        if (chatId) {
          try {
            // Chamar edge function de envio de mídia com messageId
            const { data: sendData, error: sendError } = await supabase.functions.invoke(
              "send-telegram-media",
              {
                body: {
                  chatId: String(chatId),
                  message: finalMessage,
                  mediaUrl: mediaUrl || null,
                  mediaType: mediaType || null,
                  messageId: insertedMessage.id,
                },
              }
            );

            console.log("🔵 Resposta da edge function:", { sendData, sendError });

            if (sendError) {
              console.error("❌ Erro ao enviar:", sendError);
              toast({
                title: "Erro ao enviar",
                description: sendError.message || "Não foi possível enviar a mensagem",
                variant: "destructive",
              });
              // Atualizar status para failed
              await supabase
                .from("messages")
                .update({ status: "failed" })
                .eq("id", insertedMessage.id);
            } else if (!sendData?.success) {
              console.error("❌ Falha no envio:", sendData);
              toast({
                title: "Erro ao enviar",
                description: sendData?.error || "Erro ao enviar mensagem",
                variant: "destructive",
              });
              // Atualizar status para failed
              await supabase
                .from("messages")
                .update({ status: "failed" })
                .eq("id", insertedMessage.id);
            } else {
              console.log('✅ Mensagem enviada com sucesso para o Telegram');
              toast({
                title: "Mensagem enviada",
                description: "Sua mensagem foi enviada com sucesso.",
              });
            }
          } catch (sendError: any) {
            console.error("❌ Erro ao enviar para Telegram:", sendError);
            toast({
              title: "Erro ao enviar para Telegram",
              description: sendError.message || "Não foi possível enviar a mensagem.",
              variant: "destructive",
            });
            // Atualizar status para failed
            await supabase
              .from("messages")
              .update({ status: "failed" })
              .eq("id", insertedMessage.id);
          }
        } else {
          console.error('❌ Chat ID não encontrado');
          toast({
            title: "Erro",
            description: "ID do chat Telegram não encontrado para este contato.",
            variant: "destructive",
          });
          // Atualizar status para failed
          await supabase
            .from("messages")
            .update({ status: "failed" })
            .eq("id", insertedMessage.id);
        }
      }

      setMessageText("");
      setMediaUrl(null);
      setMediaType(null);
      // Não recarrega mensagens pois o realtime cuida disso
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

  const loadAgentsAndQueues = async () => {
    try {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!userRole?.tenant_id) return;

      // Load agents
      const { data: agentsData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("tenant_id", userRole.tenant_id)
        .order("full_name");

      if (agentsData) setAgents(agentsData);

      // Load queues
      const { data: queuesData } = await supabase
        .from("queues")
        .select("id, name")
        .eq("tenant_id", userRole.tenant_id)
        .eq("is_active", true)
        .order("name");

      if (queuesData) setQueues(queuesData);
    } catch (error: any) {
      console.error("Error loading agents/queues:", error);
    }
  };

  const handleForward = async () => {
    if (!selectedTicket) return;

    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      };

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
        .eq("id", selectedTicket.id);

      if (error) throw error;

      setForwardDialogOpen(false);
      setSelectedAgent("");
      setSelectedQueue("");
      
      toast({
        title: "Ticket encaminhado",
        description: "O ticket foi encaminhado com sucesso.",
      });

      // Update local ticket state
      setSelectedTicket({ ...selectedTicket, ...updates });

      // Reload tickets and re-apply filters
      await loadTickets();
      setTimeout(() => filterTickets(), 150);
    } catch (error: any) {
      toast({
        title: "Erro ao encaminhar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async () => {
    if (!selectedTicket || !newStatus) return;

    try {
      console.log("🔄 Mudando status do ticket para:", newStatus);
      console.log("🎫 Ticket selecionado:", selectedTicket);
      
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
        .eq("id", selectedTicket.id);

      if (error) throw error;

      // Send evaluation if status is closed and auto_send_on_close is enabled
      if (newStatus === "closed") {
        console.log("🔐 Ticket fechado, iniciando processo de avaliação...");
        
        try {
          // Use userTenantId from state first, fallback to query
          const tenantId = userTenantId || selectedTicket?.tenant_id;
          
          if (!tenantId) {
            console.warn("⚠️ tenant_id não disponível, buscando da role do usuário");
            const { data: userRole } = await supabase
              .from("user_roles")
              .select("tenant_id")
              .eq("user_id", user?.id)
              .maybeSingle();

            if (!userRole?.tenant_id) {
              console.error("❌ Não foi possível obter tenant_id");
              throw new Error("Tenant ID não encontrado");
            }
            
            console.log("🔍 Tenant ID obtido da role:", userRole.tenant_id);
          }

          const finalTenantId = tenantId || userTenantId;
          console.log("🔍 Buscando configurações de avaliação para tenant:", finalTenantId);

          const { data: evalSettings, error: evalError } = await supabase
            .from("evaluation_settings")
            .select("*")
            .eq("tenant_id", finalTenantId)
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
            });
            return;
          }

          if (!evalSettings.auto_send_on_close) {
            console.log("ℹ️ Envio automático de avaliação desabilitado");
            return;
          }

          // Get fresh ticket data with full contact info
          console.log("🔄 Buscando dados atualizados do ticket...");
          const { data: freshTicket, error: ticketError } = await supabase
            .from("tickets")
            .select(`
              *,
              contact:contacts(*)
            `)
            .eq("id", selectedTicket.id)
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

      setStatusDialogOpen(false);
      setNewStatus("");
      
      toast({
        title: "Status atualizado",
        description: "O status do ticket foi atualizado com sucesso.",
      });

      // Update local ticket state immediately
      setSelectedTicket((prev: any) => prev ? { ...prev, ...updates } : null);
      
      // Force reload tickets and re-apply filters
      await loadTickets();
      setTimeout(() => filterTickets(), 150);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (forwardDialogOpen) {
      loadAgentsAndQueues();
    }
  }, [forwardDialogOpen]);

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
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
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

            {/* Filtro por Fila */}
            <Select value={queueFilter} onValueChange={setQueueFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por fila" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as filas</SelectItem>
                {queues.map((queue) => (
                  <SelectItem key={queue.id} value={queue.id}>
                    {queue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="text-xs">
                  Todos
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {tickets.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="open" className="text-xs">
                  Abertos
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {tickets.filter(t => t.status === 'open').length}
                  </Badge>
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
            {filteredTickets.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">Nenhum ticket encontrado</p>
                {tickets.length > 0 && (
                  <p className="text-xs mt-1">Total: {tickets.length} tickets</p>
                )}
              </div>
            ) : (
              filteredTickets.map((ticket) => (
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
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {getStatusBadge(ticket.status)}
                      {ticket.channel && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {ticket.channel === 'waba' ? 'WhatsApp' : ticket.channel}
                        </Badge>
                      )}
                      {ticket.queue && (
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: ticket.queue.color,
                            color: ticket.queue.color
                          }}
                        >
                          {ticket.queue.name}
                        </Badge>
                      )}
                    </div>
                    {ticket.contact?.tags && ticket.contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ticket.contact.tags.slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              ))
            )}
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{selectedTicket.contact?.name}</h3>
                      {selectedTicket.contact?.metadata?.online && (
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 bg-green-500 rounded-full" />
                          <span className="text-xs text-green-600 dark:text-green-400">Online</span>
                        </div>
                      )}
                    </div>
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
                    <div className="flex items-center gap-2 mt-1.5">
                      {selectedTicket.channel && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {selectedTicket.channel === 'waba' ? 'WhatsApp' : selectedTicket.channel}
                        </Badge>
                      )}
                      {selectedTicket.queue && (
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: selectedTicket.queue.color,
                            color: selectedTicket.queue.color
                          }}
                        >
                          {selectedTicket.queue.name}
                        </Badge>
                      )}
                    </div>
                    {selectedTicket.contact && (
                      <TagsManager 
                        contactId={selectedTicket.contact.id}
                        currentTags={selectedTicket.contact.tags || []}
                        onTagsChange={loadTickets}
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedTicket.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStatusDialogOpen(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Status
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setForwardDialogOpen(true)}
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Encaminhar
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div id="chat-messages" className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_from_contact ? "justify-start" : "justify-end"} group`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 relative ${
                      message.is_from_contact
                        ? "bg-card text-card-foreground shadow-sm border"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {message.media_url && !message.deleted_at && (
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
                        {message.media_type === 'video' && (
                          <video controls className="w-full rounded-lg">
                            <source src={message.media_url} />
                          </video>
                        )}
                        {message.media_type === 'sticker' && (
                          <img 
                            src={message.media_url} 
                            alt="Sticker" 
                            className="rounded-lg max-w-full h-auto"
                          />
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
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.deleted_at ? (
                        <span className="italic opacity-60">Mensagem deletada</span>
                      ) : (
                        message.content
                      )}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 opacity-70" />
                        <span className="text-xs opacity-70">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      {!message.is_from_contact && !message.deleted_at && (
                        <div className="flex items-center gap-1">
                          {message.status === 'sending' && (
                            <Loader2 className="h-3 w-3 animate-spin opacity-70" />
                          )}
                          {message.status === 'sent' && (
                            <Check className="h-3 w-3 opacity-70" />
                          )}
                          {message.status === 'delivered' && (
                            <CheckCheck className="h-3 w-3 opacity-70" />
                          )}
                          {message.status === 'read' && (
                            <CheckCheck className="h-3 w-3 text-blue-500" />
                          )}
                          {message.status === 'failed' && (
                            <X className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {/* Botão de deletar (só aparece no hover para mensagens não deletadas e enviadas por nós) */}
                    {!message.is_from_contact && !message.deleted_at && message.telegram_message_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={async () => {
                          try {
                            const chatId = selectedTicket.contact?.metadata?.telegram_chat_id;
                            if (!chatId) {
                              toast({
                                title: "Erro",
                                description: "Chat ID não encontrado",
                                variant: "destructive",
                              });
                              return;
                            }

                            const { error } = await supabase.functions.invoke("delete-telegram-message", {
                              body: {
                                messageId: message.id,
                                chatId: chatId,
                                telegramMessageId: message.telegram_message_id,
                              },
                            });

                            if (error) throw error;

                            toast({
                              title: "Mensagem deletada",
                              description: "A mensagem foi deletada com sucesso",
                            });

                            loadMessages(selectedTicket.id);
                          } catch (error: any) {
                            console.error("Erro ao deletar mensagem:", error);
                            toast({
                              title: "Erro",
                              description: error.message || "Não foi possível deletar a mensagem",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
                {userTenantId && (
                  <QuickReplies
                    tenantId={userTenantId}
                    onSelectReply={(message) => setMessageText(messageText + message)}
                  />
                )}
                <StickerPicker onStickerSelect={(sticker) => setMessageText(messageText + sticker)} />
                <AudioRecorder onAudioRecorded={(url) => {
                  setMediaUrl(url);
                  setMediaType("audio");
                }} />
                {tenant?.allow_agent_signature && profile?.full_name && canToggleSignature && (
                  <Button
                    type="button"
                    size="icon"
                    variant={isSignatureEnabled ? "default" : "outline"}
                    onClick={() => setIsSignatureEnabled(!isSignatureEnabled)}
                    title={isSignatureEnabled ? "Remover assinatura" : "Adicionar assinatura"}
                  >
                    <UserCheck className="h-4 w-4" />
                  </Button>
                )}
                
                {tenant?.force_agent_signature && profile?.full_name && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-xs text-muted-foreground">
                    <UserCheck className="h-3 w-3" />
                    Assinatura obrigatória
                  </div>
                )}
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

      {/* Dialog de Encaminhar */}
      <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encaminhar Atendimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Encaminhar para</Label>
              <Select value={forwardTarget} onValueChange={(value: any) => setForwardTarget(value)}>
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
              <div className="space-y-2">
                <Label>Selecione o Agente</Label>
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
              <div className="space-y-2">
                <Label>Selecione a Fila</Label>
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
                O atendimento será encaminhado para o bot automático
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

      {/* Dialog de Mudar Status */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status do Atendimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Novo Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newStatus === "closed" && (
              <p className="text-sm text-muted-foreground">
                Ao fechar o ticket, a avaliação será enviada automaticamente ao cliente (se configurado).
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStatusChange}>
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
