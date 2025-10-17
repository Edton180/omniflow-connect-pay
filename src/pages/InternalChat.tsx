import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Send, Users as UsersIcon, LogOut, User, Settings, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MediaUpload } from "@/components/tickets/MediaUpload";
import { AudioRecorder } from "@/components/chat/AudioRecorder";
import { StickerPicker } from "@/components/chat/StickerPicker";
import { TeamManagement } from "@/components/chat/TeamManagement";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function InternalChat() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [showTeamSettings, setShowTeamSettings] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadUsers();
      setupRealtimeSubscription();
    };
    init();
  }, []);

  useEffect(() => {
    if (tenantId) {
      loadTeams();
    }
  }, [tenantId]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
      setSelectedTeam(null);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMessages();
      setSelectedUser(null);
    }
  }, [selectedTeam]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('internal_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages'
        },
        (payload) => {
          // Update messages if it's for the current conversation
          if (selectedUser && 
              ((payload.new.sender_id === selectedUser.id && payload.new.recipient_id === user?.id) ||
               (payload.new.sender_id === user?.id && payload.new.recipient_id === selectedUser.id))) {
            setMessages((prev) => [...prev, payload.new]);
          }
          
          // Update messages if it's for the current team
          if (selectedTeam && payload.new.team_id === selectedTeam.id) {
            // Fetch sender info for team message
            supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", payload.new.sender_id)
              .single()
              .then(({ data }) => {
                setMessages((prev) => [...prev, {
                  ...payload.new,
                  sender: data
                }]);
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadUsers = async () => {
    if (!user) {
      console.log("No user found, cannot load users");
      return;
    }
    
    try {
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) {
        console.error("Error loading user role:", roleError);
        throw roleError;
      }

      if (!userRole?.tenant_id) {
        console.warn("User has no tenant_id");
        toast({
          title: "Aviso",
          description: "Você precisa estar associado a uma empresa",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Setting tenant_id:", userRole.tenant_id);
      setTenantId(userRole.tenant_id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("tenant_id", userRole.tenant_id)
        .neq("id", user.id);

      if (error) {
        console.error("Error loading profiles:", error);
        throw error;
      }
      
      console.log("Loaded users:", data);
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadTeams = async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name");

      if (error) throw error;
      setTeams(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar equipes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadTeamMessages = async () => {
    if (!selectedTeam || !user) return;
    try {
      const { data, error } = await supabase
        .from("internal_messages")
        .select("*, sender:profiles!internal_messages_sender_id_fkey(full_name, avatar_url)")
        .eq("team_id", selectedTeam.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadMessages = async () => {
    if (!selectedUser || !user) return;

    try {
      const { data, error } = await supabase
        .from("internal_messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSend = async (mediaUrl?: string, mediaType?: string) => {
    if ((!messageText.trim() && !mediaUrl) || !user || !tenantId || loading) return;
    if (!selectedUser && !selectedTeam) return;

    setLoading(true);
    try {
      const messageData: any = {
        sender_id: user.id,
        tenant_id: tenantId,
        content: messageText || "(mídia)",
      };

      if (selectedUser) {
        messageData.recipient_id = selectedUser.id;
      } else if (selectedTeam) {
        messageData.team_id = selectedTeam.id;
        // For team messages, set recipient_id to sender_id to pass RLS
        messageData.recipient_id = user.id;
      }

      if (mediaUrl) {
        messageData.media_url = mediaUrl;
        messageData.media_type = mediaType;
      }

      const { error } = await supabase
        .from("internal_messages")
        .insert(messageData);

      if (error) throw error;
      
      setMessageText("");
      
      // Reload messages to get the new one with sender info for teams
      if (selectedTeam) {
        await loadTeamMessages();
      }
    } catch (error: any) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSelect = (url: string, type: string) => {
    handleSend(url, type);
  };

  const handleAudioRecorded = (url: string) => {
    handleSend(url, 'audio');
  };

  const handleStickerSelect = (sticker: string) => {
    setMessageText(messageText + sticker);
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card h-14 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Chat Interno</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r flex flex-col bg-card">
          <div className="p-3 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "users" | "teams" | "config")} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users" className="text-xs">
                  <UsersIcon className="h-3 w-3 mr-1" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger value="teams" className="text-xs">
                  Equipes
                </TabsTrigger>
                <TabsTrigger value="config" className="text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Config
                </TabsTrigger>
              </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "users" && (
              <div className="h-full">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedUser?.id === u.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={u.avatar_url} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm truncate block">
                          {u.full_name || 'Sem nome'}
                        </span>
                        <span className="text-xs text-foreground/60 truncate block">
                          {u.phone || 'Sem telefone'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === "teams" && (
              <div className="h-full space-y-2 p-2">
                <Button
                  onClick={() => setShowTeamDialog(true)}
                  className="w-full"
                  size="sm"
                >
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Criar Nova Equipe
                </Button>
                {teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedTeam?.id === team.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UsersIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm truncate block">
                          {team.name}
                        </span>
                        {team.description && (
                          <span className="text-xs text-foreground/60 truncate block">
                            {team.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === "config" && tenantId && (
              <div className="p-2">
                <ChatConfigTab tenantId={tenantId} />
              </div>
            )}
          </div>
          
          <TeamDialog
            open={showTeamDialog}
            onOpenChange={setShowTeamDialog}
            tenantId={tenantId || ""}
            onSuccess={() => {
              loadUsers();
              loadTeams();
            }}
          />
        </div>

        {/* Área de Chat */}
        {(selectedUser || selectedTeam) ? (
          <div className="flex-1 flex flex-col">
            <div className="border-b p-4 bg-card shadow-sm">
              <div className="flex items-center gap-3">
                {selectedUser ? (
                  <>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedUser.avatar_url} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                     <div>
                      <h3 className="font-semibold text-foreground">{selectedUser.full_name}</h3>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-foreground/60">Online</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UsersIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedTeam?.name}</h3>
                      <span className="text-xs text-foreground/60">Equipe</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-muted/30 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-foreground/60 py-12">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-sm font-medium">Nenhuma mensagem ainda</p>
                  <p className="text-xs mt-1">Seja o primeiro a enviar uma mensagem</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.sender_id === user?.id;
                  const showSenderName = selectedTeam && !isOwnMessage;
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border'
                        }`}
                      >
                        {showSenderName && (
                          <p className="text-xs font-semibold mb-1 text-primary">
                            {msg.sender?.full_name || 'Usuário'}
                          </p>
                        )}
                        {msg.media_url && (
                          <div className="mb-2">
                            {msg.media_type === 'image' ? (
                              <img src={msg.media_url} alt="Mídia" className="rounded-lg max-w-full" />
                            ) : msg.media_type === 'audio' ? (
                              <audio controls src={msg.media_url} className="max-w-full" />
                            ) : (
                              <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                                Ver arquivo
                              </a>
                            )}
                          </div>
                        )}
                        <p className="text-sm break-words">{msg.content}</p>
                        <span className={`text-xs mt-1 block ${isOwnMessage ? 'opacity-80' : 'text-foreground/60'}`}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t p-4 bg-card shadow-lg">
              <div className="flex gap-2 items-center">
                <MediaUpload onMediaSelect={handleMediaSelect} />
                <AudioRecorder onAudioRecorded={handleAudioRecorded} />
                <StickerPicker onStickerSelect={handleStickerSelect} />
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Digite sua mensagem..."
                  disabled={loading}
                  className="flex-1 bg-background"
                />
                <Button 
                  onClick={() => handleSend()} 
                  size="icon" 
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-foreground/60">
              <UsersIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Selecione um usuário para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
