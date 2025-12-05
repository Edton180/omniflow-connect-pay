import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Plus, User, Mail, Phone, Pencil, Trash2, MessageSquare, PlusCircle, Filter } from "lucide-react";
import { ContactDialog } from "./ContactDialog";
import { useAuth } from "@/hooks/useAuth";
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

type ChannelFilterType = "all" | "telegram" | "whatsapp" | "email" | "webchat";

export const ContactList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<ChannelFilterType>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<any>(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("name");

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar contatos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const getContactChannel = (contact: any): ChannelFilterType => {
    if (contact.metadata?.telegram_chat_id) return "telegram";
    if (contact.metadata?.whatsapp_id || (contact.phone && !contact.metadata?.telegram_chat_id)) return "whatsapp";
    if (contact.email && !contact.phone) return "email";
    if (contact.metadata?.webchat_session_id) return "webchat";
    return "whatsapp";
  };

  const getChannelBadge = (contact: any) => {
    const channel = getContactChannel(contact);
    switch (channel) {
      case "telegram":
        return <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">📱 Telegram</Badge>;
      case "whatsapp":
        return <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">💬 WhatsApp</Badge>;
      case "email":
        return <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20">📧 Email</Badge>;
      case "webchat":
        return <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">🌐 WebChat</Badge>;
      default:
        return null;
    }
  };

  const handleCreate = () => {
    setSelectedContact(null);
    setDialogOpen(true);
  };

  const handleEdit = (contact: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContact(contact);
    setDialogOpen(true);
  };

  const handleDeleteClick = (contact: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactToDelete.id);

      if (error) throw error;

      toast({
        title: "Contato excluído",
        description: "O contato foi excluído com sucesso.",
      });

      fetchContacts();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir contato",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  const handleViewConversation = async (contact: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!userRole?.tenant_id) {
        toast({
          title: "Erro",
          description: "Tenant não encontrado",
          variant: "destructive",
        });
        return;
      }

      const { data: existingTicket } = await supabase
        .from("tickets")
        .select("*")
        .eq("contact_id", contact.id)
        .eq("tenant_id", userRole.tenant_id)
        .in("status", ["open", "pending"])
        .maybeSingle();

      if (existingTicket) {
        navigate("/tickets-improved", { state: { ticketId: existingTicket.id } });
      } else {
        toast({
          title: "Nenhuma conversa",
          description: "Este contato não possui conversas abertas",
          variant: "default",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStartConversation = async (contact: any, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!userRole?.tenant_id) {
        toast({
          title: "Erro",
          description: "Tenant não encontrado",
          variant: "destructive",
        });
        return;
      }

      const channel = contact.metadata?.telegram_chat_id ? "telegram" : 
                     contact.phone ? "whatsapp" : "email";

      const { data: newTicket, error } = await supabase
        .from("tickets")
        .insert({
          contact_id: contact.id,
          tenant_id: userRole.tenant_id,
          channel: channel,
          status: "open",
          priority: "medium",
          assigned_to: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Conversa iniciada",
        description: "Nova conversa criada com sucesso",
      });

      navigate("/tickets-improved", { state: { ticketId: newTicket.id } });
    } catch (error: any) {
      toast({
        title: "Erro ao iniciar conversa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name?.toLowerCase().includes(search.toLowerCase()) ||
      contact.phone?.includes(search) ||
      contact.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesChannel = channelFilter === "all" || getContactChannel(contact) === channelFilter;
    
    return matchesSearch && matchesChannel;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Channel Filter */}
        <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as ChannelFilterType)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os canais</SelectItem>
            <SelectItem value="telegram">📱 Telegram</SelectItem>
            <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
            <SelectItem value="email">📧 Email</SelectItem>
            <SelectItem value="webchat">🌐 WebChat</SelectItem>
          </SelectContent>
        </Select>
        
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum contato encontrado</p>
            <p className="text-sm text-muted-foreground mb-4">
              {search || channelFilter !== "all" ? "Tente ajustar seus filtros" : "Crie seu primeiro contato"}
            </p>
            {!search && channelFilter === "all" && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Contato
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="gradient-card hover-scale">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {contact.avatar_url ? (
                      <img
                        src={contact.avatar_url}
                        alt={contact.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{contact.name}</CardTitle>
                      {getChannelBadge(contact)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={(e) => handleEdit(contact, e)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={(e) => handleDeleteClick(contact, e)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {contact.phone}
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {contact.email}
                  </div>
                )}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => handleViewConversation(contact, e)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Ver Conversa
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={(e) => handleStartConversation(contact, e)}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Nova Conversa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={selectedContact}
        onSuccess={fetchContacts}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contato <strong>{contactToDelete?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
