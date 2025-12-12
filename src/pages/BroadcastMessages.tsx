import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Send, Users, Search, MessageSquare, 
  Phone, Mail, Loader2, CheckCircle2, XCircle, Clock, 
  Filter, Image, Paperclip, X, Calendar, History, 
  BarChart3, Play, Pause, RefreshCw, FileText, RotateCcw,
  Info, Eye, AlertCircle
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TemplateSelector } from "@/components/broadcast/TemplateSelector";
import { InteractiveMessageBuilder, InteractiveButton } from "@/components/broadcast/InteractiveMessageBuilder";

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  tags?: string[];
  metadata?: any;
  selected: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface BroadcastStatus {
  total: number;
  sent: number;
  failed: number;
  pending: number;
}

interface Campaign {
  id: string;
  name: string;
  message: string;
  status: string;
  total_contacts: number;
  sent_count: number;
  failed_count: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  channel: { name: string; type: string } | null;
}

type ChannelFilterType = "all" | "telegram" | "whatsapp" | "email" | "webchat";

export default function BroadcastMessages() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isSuperAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [message, setMessage] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>("");
  const [channelFilter, setChannelFilter] = useState<ChannelFilterType>("all");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [broadcastStatus, setBroadcastStatus] = useState<BroadcastStatus | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [sendSpeed, setSendSpeed] = useState<"slow" | "medium" | "fast">("medium");

  const speedDelays = { slow: 2000, medium: 1000, fast: 500 };

  useEffect(() => {
    if (user?.id) {
      loadTenantAndData();
    }
  }, [user?.id]);

  const loadTenantAndData = async () => {
    setLoading(true);
    try {
      let tid = profile?.tenant_id;
      
      if (!tid && !isSuperAdmin) {
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("tenant_id")
          .eq("user_id", user!.id)
          .maybeSingle();
        tid = userRole?.tenant_id || null;
      }

      if (!tid && !isSuperAdmin) {
        toast({
          title: "Erro",
          description: "Você não está associado a nenhuma empresa",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setTenantId(tid);
      await Promise.all([
        loadContacts(tid),
        loadChannels(tid),
        loadCampaigns(tid),
      ]);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async (tid: string | null) => {
    if (!tid) return;

    const { data, error } = await supabase
      .from("contacts")
      .select("id, name, phone, email, avatar_url, tags, metadata")
      .eq("tenant_id", tid)
      .order("name");

    if (error) throw error;

    const contactsWithSelection = (data || []).map(c => ({
      ...c,
      selected: false,
    }));

    setContacts(contactsWithSelection);

    const tags = new Set<string>();
    data?.forEach(contact => {
      contact.tags?.forEach((tag: string) => tags.add(tag));
    });
    setAvailableTags(Array.from(tags));
  };

  const loadChannels = async (tid: string | null) => {
    if (!tid) return;

    const { data, error } = await supabase
      .from("channels")
      .select("id, name, type, status")
      .eq("tenant_id", tid)
      .eq("status", "active")
      .in("type", ["telegram", "whatsapp", "waba"]);

    if (error) throw error;
    setChannels(data || []);
  };

  const loadCampaigns = async (tid: string | null) => {
    if (!tid) return;

    const { data, error } = await supabase
      .from("broadcast_campaigns")
      .select("*, channel:channels(name, type)")
      .eq("tenant_id", tid)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error loading campaigns:", error);
      return;
    }
    setCampaigns(data || []);
  };

  const getContactChannel = (contact: Contact): ChannelFilterType => {
    if (contact.metadata?.telegram_chat_id) return "telegram";
    if (contact.metadata?.whatsapp_id || (contact.phone && !contact.metadata?.telegram_chat_id)) return "whatsapp";
    if (contact.email && !contact.phone) return "email";
    if (contact.metadata?.webchat_session_id) return "webchat";
    return "whatsapp";
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setContacts(prev => prev.map(c => {
      const matchesFilter = channelFilter === "all" || getContactChannel(c) === channelFilter;
      return { ...c, selected: matchesFilter ? checked : c.selected };
    }));
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    setContacts(prev => prev.map(c => 
      c.id === contactId ? { ...c, selected: checked } : c
    ));
    setSelectAll(false);
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !tagFilter || contact.tags?.includes(tagFilter);
    
    const matchesChannel = channelFilter === "all" || getContactChannel(contact) === channelFilter;
    
    return matchesSearch && matchesTag && matchesChannel;
  });

  const selectedCount = contacts.filter(c => c.selected).length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `broadcast/${tenantId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("ticket-media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("ticket-media")
        .getPublicUrl(filePath);

      setMediaUrl(publicUrl);
      
      if (file.type.startsWith("image/")) {
        setMediaType("image");
      } else if (file.type.startsWith("video/")) {
        setMediaType("video");
      } else if (file.type.startsWith("audio/")) {
        setMediaType("audio");
      } else {
        setMediaType("document");
      }

      toast({
        title: "Arquivo enviado",
        description: "O arquivo foi carregado com sucesso.",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro ao enviar arquivo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
  };

  const handleSendBroadcast = async () => {
    const selectedContacts = contacts.filter(c => c.selected);
    
    if (selectedContacts.length === 0) {
      toast({
        title: "Selecione contatos",
        description: "Você precisa selecionar pelo menos um contato para enviar.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedChannel) {
      toast({
        title: "Selecione um canal",
        description: "Você precisa selecionar um canal de envio.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim() && !mediaUrl) {
      toast({
        title: "Digite uma mensagem",
        description: "A mensagem não pode estar vazia.",
        variant: "destructive",
      });
      return;
    }

    const channel = channels.find(c => c.id === selectedChannel);

    // Criar campanha no banco
    const { data: campaign, error: campaignError } = await supabase
      .from("broadcast_campaigns")
      .insert({
        tenant_id: tenantId,
        channel_id: selectedChannel,
        name: campaignName || `Campanha ${format(new Date(), "dd/MM HH:mm")}`,
        message: message.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
        status: scheduledAt ? "scheduled" : "running",
        scheduled_at: scheduledAt || null,
        total_contacts: selectedContacts.length,
        created_by: user?.id,
      })
      .select()
      .single();

    if (campaignError) {
      toast({
        title: "Erro ao criar campanha",
        description: campaignError.message,
        variant: "destructive",
      });
      return;
    }

    // Se agendado, não enviar agora
    if (scheduledAt) {
      toast({
        title: "Campanha agendada",
        description: `Será enviada em ${format(new Date(scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      });
      loadCampaigns(tenantId);
      resetForm();
      return;
    }

    // Enviar imediatamente
    setSending(true);
    setBroadcastStatus({
      total: selectedContacts.length,
      sent: 0,
      failed: 0,
      pending: selectedContacts.length,
    });

    try {
      let sentCount = 0;
      let failedCount = 0;

      for (const contact of selectedContacts) {
        try {
          let functionName = "";
          let body: any = { message: message.trim() };

          let personalizedMessage = message.trim()
            .replace(/\{\{nome\}\}/g, contact.name || "")
            .replace(/\{\{telefone\}\}/g, contact.phone || "");

          body.message = personalizedMessage;

          if (mediaUrl) {
            body.mediaUrl = mediaUrl;
            body.mediaType = mediaType;
          }

          if (channel?.type === "telegram") {
            functionName = mediaUrl ? "send-telegram-media" : "send-telegram-message";
            const chatId = contact.metadata?.telegram_chat_id;
            
            if (!chatId) {
              throw new Error("Contato sem chat_id do Telegram");
            }
            
            body.chatId = String(chatId);
          } else if (channel?.type === "whatsapp" || channel?.type === "waba") {
            functionName = "send-waba-message";
            body.to = contact.phone;
          }

          if (functionName) {
            const { error } = await supabase.functions.invoke(functionName, { body });
            if (error) throw error;
            sentCount++;
          }

          setBroadcastStatus(prev => prev ? {
            ...prev,
            sent: prev.sent + 1,
            pending: prev.pending - 1,
          } : null);

          // Rate limiting based on speed
          await new Promise(resolve => setTimeout(resolve, speedDelays[sendSpeed]));

        } catch (err: any) {
          console.error(`Error sending to ${contact.name}:`, err);
          failedCount++;
          setBroadcastStatus(prev => prev ? {
            ...prev,
            failed: prev.failed + 1,
            pending: prev.pending - 1,
          } : null);
        }
      }

      // Atualizar campanha
      await supabase
        .from("broadcast_campaigns")
        .update({
          status: "completed",
          sent_count: sentCount,
          failed_count: failedCount,
          completed_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);

      toast({
        title: "Disparo concluído",
        description: `${sentCount} enviados, ${failedCount} falhas.`,
      });

      loadCampaigns(tenantId);

    } catch (error: any) {
      toast({
        title: "Erro no disparo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setMessage("");
    setCampaignName("");
    setMediaUrl(null);
    setMediaType(null);
    setScheduledAt("");
    setContacts(prev => prev.map(c => ({ ...c, selected: false })));
    setSelectAll(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="secondary">Rascunho</Badge>;
      case "scheduled": return <Badge variant="outline" className="border-blue-500 text-blue-500">Agendado</Badge>;
      case "running": return <Badge variant="default" className="bg-yellow-500">Enviando</Badge>;
      case "completed": return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
      case "paused": return <Badge variant="secondary">Pausado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white shadow-lg">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Disparo em Massa</h1>
              <p className="text-xs text-muted-foreground">Envie mensagens para múltiplos contatos</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="send" className="space-y-4">
          <TabsList>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Novo Disparo
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - Contact Selection */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Selecionar Contatos
                        </CardTitle>
                        <CardDescription>
                          {selectedCount} de {contacts.length} contatos selecionados
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        />
                        <Label>Selecionar todos</Label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex gap-4 flex-wrap">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Pesquisar contatos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      
                      <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as ChannelFilterType)}>
                        <SelectTrigger className="w-[180px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filtrar por canal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os canais</SelectItem>
                          <SelectItem value="telegram">Telegram</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="webchat">WebChat</SelectItem>
                        </SelectContent>
                      </Select>

                      {availableTags.length > 0 && (
                        <Select value={tagFilter} onValueChange={setTagFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por tag" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todas as tags</SelectItem>
                            {availableTags.map(tag => (
                              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Contact List */}
                    <ScrollArea className="h-[400px] border rounded-lg">
                      {filteredContacts.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum contato encontrado</p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {filteredContacts.map(contact => (
                            <div
                              key={contact.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                contact.selected 
                                  ? "bg-primary/10 border border-primary/20" 
                                  : "hover:bg-muted"
                              }`}
                              onClick={() => handleSelectContact(contact.id, !contact.selected)}
                            >
                              <Checkbox
                                checked={contact.selected}
                                onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                              />
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={contact.avatar_url || undefined} />
                                <AvatarFallback>
                                  {contact.name?.charAt(0).toUpperCase() || "C"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{contact.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {contact.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {contact.phone}
                                    </span>
                                  )}
                                  {contact.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {contact.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {getContactChannel(contact) === "telegram" && "📱 Telegram"}
                                {getContactChannel(contact) === "whatsapp" && "💬 WhatsApp"}
                                {getContactChannel(contact) === "email" && "📧 Email"}
                                {getContactChannel(contact) === "webchat" && "🌐 WebChat"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Message Composition */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Compor Mensagem
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Nome da Campanha</Label>
                      <Input
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="Ex: Promoção Dezembro"
                      />
                    </div>

                    <div>
                      <Label>Canal de Envio</Label>
                      <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o canal" />
                        </SelectTrigger>
                        <SelectContent>
                          {channels.map(channel => (
                            <SelectItem key={channel.id} value={channel.id}>
                              {channel.name} ({channel.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Mensagem</Label>
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Digite sua mensagem aqui..."
                        rows={5}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {message.length} caracteres
                      </p>
                    </div>

                    {/* Media Upload */}
                    <div>
                      <Label>Mídia (opcional)</Label>
                      {mediaUrl ? (
                        <div className="border rounded-lg p-3 mt-2 relative">
                          {mediaType === "image" && (
                            <img src={mediaUrl} alt="Preview" className="max-h-32 rounded" />
                          )}
                          {mediaType !== "image" && (
                            <div className="flex items-center gap-2 text-sm">
                              <Paperclip className="h-4 w-4" />
                              <span>Arquivo anexado</span>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1"
                            onClick={removeMedia}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            onClick={() => document.getElementById("media-upload")?.click()}
                          >
                            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Image className="h-4 w-4 mr-2" />}
                            Imagem
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            onClick={() => document.getElementById("file-upload")?.click()}
                          >
                            <Paperclip className="h-4 w-4 mr-2" />
                            Arquivo
                          </Button>
                          <input
                            id="media-upload"
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                          <input
                            id="file-upload"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </div>
                      )}
                    </div>

                    {/* Schedule */}
                    <div>
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Agendar (opcional)
                      </Label>
                      <Input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                      />
                    </div>

                    {/* Speed */}
                    <div>
                      <Label>Velocidade de Envio</Label>
                      <Select value={sendSpeed} onValueChange={(v) => setSendSpeed(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Lento (2s)</SelectItem>
                          <SelectItem value="medium">Médio (1s)</SelectItem>
                          <SelectItem value="fast">Rápido (0.5s)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Velocidade mais lenta reduz risco de bloqueio
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                      <p className="font-medium mb-1">Variáveis disponíveis:</p>
                      <p>{"{{nome}}"} - Nome do contato</p>
                      <p>{"{{telefone}}"} - Telefone do contato</p>
                    </div>

                    <Button
                      onClick={handleSendBroadcast}
                      disabled={sending || selectedCount === 0 || !selectedChannel || (!message.trim() && !mediaUrl)}
                      className="w-full"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : scheduledAt ? (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar para {selectedCount} contatos
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar para {selectedCount} contatos
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Broadcast Status */}
                {broadcastStatus && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Status do Envio</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Progress 
                        value={((broadcastStatus.sent + broadcastStatus.failed) / broadcastStatus.total) * 100} 
                      />
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{broadcastStatus.sent}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span>{broadcastStatus.failed}</span>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Clock className="h-4 w-4" />
                          <span>{broadcastStatus.pending}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Histórico de Campanhas
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => loadCampaigns(tenantId)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma campanha realizada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaigns.map(campaign => (
                      <div key={campaign.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{campaign.name}</h4>
                              {getStatusBadge(campaign.status)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {campaign.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>📅 {format(new Date(campaign.created_at), "dd/MM/yyyy HH:mm")}</span>
                              {campaign.channel && (
                                <span>📱 {campaign.channel.name}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-green-600">{campaign.sent_count || 0} ✓</span>
                              <span className="text-red-600">{campaign.failed_count || 0} ✗</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              de {campaign.total_contacts} contatos
                            </p>
                            {campaign.scheduled_at && campaign.status === "scheduled" && (
                              <p className="text-xs text-blue-500 mt-1">
                                Agendado: {format(new Date(campaign.scheduled_at), "dd/MM HH:mm")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
