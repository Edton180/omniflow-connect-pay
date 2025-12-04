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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Send, Users, Search, MessageSquare, 
  Phone, Mail, Upload, FileSpreadsheet, Loader2,
  CheckCircle2, XCircle, Clock, Filter
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  tags?: string[];
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

export default function BroadcastMessages() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isSuperAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [message, setMessage] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [broadcastStatus, setBroadcastStatus] = useState<BroadcastStatus | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadTenantAndData();
    }
  }, [user?.id]);

  const loadTenantAndData = async () => {
    setLoading(true);
    try {
      // Get tenant ID
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
      .select("id, name, phone, email, avatar_url, tags")
      .eq("tenant_id", tid)
      .order("name");

    if (error) throw error;

    const contactsWithSelection = (data || []).map(c => ({
      ...c,
      selected: false,
    }));

    setContacts(contactsWithSelection);

    // Extract unique tags
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

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setContacts(prev => prev.map(c => ({ ...c, selected: checked })));
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
    
    return matchesSearch && matchesTag;
  });

  const selectedCount = contacts.filter(c => c.selected).length;

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

    if (!message.trim()) {
      toast({
        title: "Digite uma mensagem",
        description: "A mensagem não pode estar vazia.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setBroadcastStatus({
      total: selectedContacts.length,
      sent: 0,
      failed: 0,
      pending: selectedContacts.length,
    });

    try {
      const channel = channels.find(c => c.id === selectedChannel);
      
      for (const contact of selectedContacts) {
        try {
          let functionName = "";
          let body: any = { message: message.trim() };

          if (channel?.type === "telegram") {
            functionName = "send-telegram-message";
            const chatId = contact.phone?.startsWith("@") 
              ? contact.phone 
              : contact.phone;
            body.chatId = chatId;
          } else if (channel?.type === "whatsapp" || channel?.type === "waba") {
            functionName = "send-waba-message";
            body.to = contact.phone;
          }

          if (functionName) {
            const { error } = await supabase.functions.invoke(functionName, { body });
            
            if (error) throw error;

            setBroadcastStatus(prev => prev ? {
              ...prev,
              sent: prev.sent + 1,
              pending: prev.pending - 1,
            } : null);
          }

          // Rate limiting - wait 1 second between messages
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (err: any) {
          console.error(`Error sending to ${contact.name}:`, err);
          setBroadcastStatus(prev => prev ? {
            ...prev,
            failed: prev.failed + 1,
            pending: prev.pending - 1,
          } : null);
        }
      }

      toast({
        title: "Disparo concluído",
        description: `Enviado para ${selectedContacts.length} contatos.`,
      });

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
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
                  {availableTags.length > 0 && (
                    <Select value={tagFilter} onValueChange={setTagFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
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
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex gap-1">
                              {contact.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
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
                  {channels.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Nenhum canal ativo disponível
                    </p>
                  )}
                </div>

                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua mensagem aqui..."
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.length} caracteres
                  </p>
                </div>

                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                  <p className="font-medium mb-1">Variáveis disponíveis:</p>
                  <p>{"{{nome}}"} - Nome do contato</p>
                  <p>{"{{telefone}}"} - Telefone do contato</p>
                </div>

                <Button
                  onClick={handleSendBroadcast}
                  disabled={sending || selectedCount === 0 || !selectedChannel || !message.trim()}
                  className="w-full"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
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
                  <CardTitle className="text-sm">Status do Disparo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress 
                    value={((broadcastStatus.sent + broadcastStatus.failed) / broadcastStatus.total) * 100} 
                  />
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 mx-auto text-green-500 mb-1" />
                      <p className="font-bold">{broadcastStatus.sent}</p>
                      <p className="text-xs text-muted-foreground">Enviados</p>
                    </div>
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <XCircle className="h-4 w-4 mx-auto text-red-500 mb-1" />
                      <p className="font-bold">{broadcastStatus.failed}</p>
                      <p className="text-xs text-muted-foreground">Falhas</p>
                    </div>
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <Clock className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
                      <p className="font-bold">{broadcastStatus.pending}</p>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
