import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Search, Send, Users as UsersIcon, LogOut, User, Settings } from "lucide-react";
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
    loadUsers();
    loadTeams();
    setupRealtimeSubscription();
  }, []);

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
          if (selectedUser && 
              ((payload.new.sender_id === selectedUser.id && payload.new.recipient_id === user?.id) ||
               (payload.new.sender_id === user?.id && payload.new.recipient_id === selectedUser.id))) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadUsers = async () => {
    try {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!userRole?.tenant_id) return;
      setTenantId(userRole.tenant_id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("tenant_id", userRole.tenant_id)
        .neq("id", user?.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
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
        <Button variant="outline" size="icon" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
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

            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users" className="text-xs">
                  <UsersIcon className="h-3 w-3 mr-1" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger value="teams" className="text-xs">
                  Equipes
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Config
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="mt-4">
                {tenantId && <TeamManagement tenantId={tenantId} />}
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="users" className="h-full">
              <TabsContent value="users" className="h-full mt-0">
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
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm truncate block">
                          {u.full_name || 'Sem nome'}
                        </span>
                        <span className="text-xs text-muted-foreground truncate block">
                          {u.phone || 'Sem telefone'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="teams" className="h-full mt-0">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
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
                          <span className="text-xs text-muted-foreground truncate block">
                            {team.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Área de Chat */}
        {(selectedUser || selectedTeam) ? (
          <div className="flex-1 flex flex-col">
            <div className="border-b p-4 bg-card">
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
                      <h3 className="font-semibold">{selectedUser.full_name}</h3>
                      <span className="text-xs text-green-500">Online</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UsersIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedTeam?.name}</h3>
                      <span className="text-xs text-muted-foreground">Equipe</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-muted/20 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                  <p className="text-xs">Seja o primeiro a enviar uma mensagem</p>
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
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card'
                        }`}
                      >
                        {showSenderName && (
                          <p className="text-xs font-semibold mb-1">
                            {msg.sender?.full_name || 'Usuário'}
                          </p>
                        )}
                        {msg.media_url && (
                          <div className="mb-2">
                            {msg.media_type === 'image' ? (
                              <img src={msg.media_url} alt="Mídia" className="rounded max-w-full" />
                            ) : msg.media_type === 'audio' ? (
                              <audio controls src={msg.media_url} className="max-w-full" />
                            ) : (
                              <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                                Ver arquivo
                              </a>
                            )}
                          </div>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t p-4 bg-card">
              <div className="flex gap-2">
                <MediaUpload onMediaSelect={handleMediaSelect} />
                <StickerPicker onStickerSelect={handleStickerSelect} />
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Digite sua mensagem..."
                  disabled={loading}
                />
                <AudioRecorder onAudioRecorded={handleAudioRecorded} />
                <Button onClick={() => handleSend()} size="icon" disabled={loading}>
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <UsersIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Selecione um usuário para começar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
