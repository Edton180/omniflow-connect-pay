import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Send, Users as UsersIcon, LogOut, User, Settings, MessageCircle, RefreshCw, UserPlus, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MediaUpload } from "@/components/tickets/MediaUpload";
import { AudioRecorder } from "@/components/chat/AudioRecorder";
import { StickerPicker } from "@/components/chat/StickerPicker";
import { TeamDialog } from "@/components/chat/TeamDialog";
import { TeamMembersDialog } from "@/components/chat/TeamMembersDialog";
import { ChatConfigTab } from "@/components/chat/ChatConfigTab";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { OnlineStatus } from "@/components/chat/OnlineStatus";
import { usePresence } from "@/hooks/usePresence";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

interface UserWithRoles {
  id: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  roles: string[];
  unreadCount?: number;
  isOnline?: boolean;
  status?: "available" | "busy" | "away";
}

interface Tenant {
  id: string;
  name: string;
}

export default function InternalChat() {
  const navigate = useNavigate();
  const { signOut, user, isSuperAdmin, hasRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "teams" | "config">("users");
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showTeamMembersDialog, setShowTeamMembersDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<{ id: string; name: string } | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Presence and typing hooks
  usePresence(tenantId);
  const { typingUsers, sendTypingIndicator } = useTypingIndicator({
    conversationUserId: selectedUser?.id,
    teamId: selectedTeam?.id,
    tenantId,
  });

  // Load tenants for Super Admin
  const loadTenants = useCallback(async () => {
    if (!isSuperAdmin) return;
    
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      setTenants(data || []);
      
      // Auto-select first tenant if none selected
      if (data && data.length > 0 && !selectedTenantId) {
        setSelectedTenantId(data[0].id);
      }
    } catch (error: any) {
      console.error("Error loading tenants:", error);
    }
  }, [isSuperAdmin, selectedTenantId]);

  // Main initialization effect - depends on user being loaded
  useEffect(() => {
    if (!user?.id) {
      console.log("Waiting for user authentication...");
      return;
    }

    if (isSuperAdmin) {
      loadTenants();
    } else {
      loadUsers();
    }
  }, [user?.id, isSuperAdmin, loadTenants]);

  // Effect for Super Admin tenant selection
  useEffect(() => {
    if (isSuperAdmin && selectedTenantId) {
      setTenantId(selectedTenantId);
      loadUsersForTenant(selectedTenantId);
    }
  }, [isSuperAdmin, selectedTenantId]);

  useEffect(() => {
    if (tenantId) {
      loadTeams();
      const cleanup = setupPresenceSubscription();
      return cleanup;
    }
  }, [tenantId]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
      setSelectedTeam(null);
      markMessagesAsRead(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMessages();
      setSelectedUser(null);
    }
  }, [selectedTeam]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [selectedUser, selectedTeam, user?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const setupPresenceSubscription = () => {
    if (!tenantId) return () => {};

    const channel = supabase
      .channel(`presence:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const presence = payload.new as any;
          setUsers((prev) =>
            prev.map((u) =>
              u.id === presence.user_id
                ? { ...u, isOnline: presence.is_online, status: presence.status }
                : u
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const setupRealtimeSubscription = () => {
    if (!user?.id) return () => {};

    const channelName = selectedUser
      ? `dm:${[user.id, selectedUser.id].sort().join("-")}`
      : selectedTeam
      ? `team:${selectedTeam.id}`
      : `global:${tenantId || "none"}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "internal_messages",
        },
        async (payload) => {
          const newMessage = payload.new as any;

          // Update messages if it's for the current conversation
          if (
            selectedUser &&
            ((newMessage.sender_id === selectedUser.id && newMessage.recipient_id === user.id) ||
              (newMessage.sender_id === user.id && newMessage.recipient_id === selectedUser.id))
          ) {
            setMessages((prev) => [...prev, newMessage]);
            if (newMessage.sender_id === selectedUser.id) {
              markMessagesAsRead(selectedUser.id);
            }
          }

          // Update messages if it's for the current team
          if (selectedTeam && newMessage.team_id === selectedTeam.id) {
            const { data: sender } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", newMessage.sender_id)
              .single();

            setMessages((prev) => [...prev, { ...newMessage, sender }]);
          }

          // Update unread count for users
          if (!selectedUser || newMessage.sender_id !== selectedUser.id) {
            loadUnreadCounts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async (userId: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from("internal_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", userId)
        .eq("recipient_id", user.id)
        .is("read_at", null);

      loadUnreadCounts();
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const loadUnreadCounts = async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from("internal_messages")
        .select("sender_id")
        .eq("recipient_id", user.id)
        .is("read_at", null);

      const counts: Record<string, number> = {};
      data?.forEach((msg) => {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
      });

      setUsers((prev) =>
        prev.map((u) => ({ ...u, unreadCount: counts[u.id] || 0 }))
      );
    } catch (error) {
      console.error("Error loading unread counts:", error);
    }
  };

  const loadUsersForTenant = async (targetTenantId: string) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch profiles with roles for the target tenant
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("tenant_id", targetTenantId);

      if (profilesError) throw profilesError;

      // Fetch roles and presence for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (userProfile) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userProfile.id)
            .eq("tenant_id", targetTenantId);

          const { data: presence } = await supabase
            .from("user_presence")
            .select("is_online, status")
            .eq("user_id", userProfile.id)
            .maybeSingle();

          return {
            ...userProfile,
            roles: roles?.map((r) => r.role) || [],
            isOnline: presence?.is_online || false,
            status: (presence?.status as "available" | "busy" | "away") || "available",
          };
        })
      );

      setUsers(usersWithRoles || []);
      loadUnreadCounts();
    } catch (error: any) {
      console.error("Error loading users for tenant:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!user?.id) {
      console.log("No user found, cannot load users");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.tenant_id) {
        console.log("User has no tenant_id");
        setLoading(false);
        return;
      }

      setTenantId(profile.tenant_id);

      // Check if user has role
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("tenant_id", profile.tenant_id)
        .maybeSingle();

      // Create role if doesn't exist
      if (!userRole) {
        await supabase.from("user_roles").insert({
          user_id: user.id,
          tenant_id: profile.tenant_id,
          role: "tenant_admin",
        });
      }

      // Fetch profiles with roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .neq("id", user.id);

      if (profilesError) throw profilesError;

      // Fetch roles and presence for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (userProfile) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userProfile.id)
            .eq("tenant_id", profile.tenant_id);

          const { data: presence } = await supabase
            .from("user_presence")
            .select("is_online, status")
            .eq("user_id", userProfile.id)
            .maybeSingle();

          return {
            ...userProfile,
            roles: roles?.map((r) => r.role) || [],
            isOnline: presence?.is_online || false,
            status: (presence?.status as "available" | "busy" | "away") || "available",
          };
        })
      );

      setUsers(usersWithRoles || []);
      loadUnreadCounts();
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},recipient_id.eq.${user.id})`
        )
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
    navigate("/");
  };

  const handleRefresh = () => {
    if (isSuperAdmin && selectedTenantId) {
      loadUsersForTenant(selectedTenantId);
    } else {
      loadUsers();
    }
    loadTeams();
    toast({
      title: "Atualizado",
      description: "Lista de usuários e equipes atualizada",
    });
  };

  const handleSend = async (mediaUrl?: string, mediaType?: string) => {
    if ((!messageText.trim() && !mediaUrl) || !user || !tenantId || sendingMessage) return;
    
    if (!selectedUser && !selectedTeam) {
      toast({
        title: "Selecione um destinatário",
        description: "Escolha um usuário ou equipe para enviar a mensagem",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
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
        // For team messages, we need a valid recipient_id
        // Use the first team member that's not the sender
        const { data: teamMembers } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("team_id", selectedTeam.id)
          .neq("user_id", user.id)
          .limit(1);
        
        if (teamMembers && teamMembers.length > 0) {
          messageData.recipient_id = teamMembers[0].user_id;
        } else {
          // Fallback: use sender as recipient for team broadcast
          messageData.recipient_id = user.id;
        }
      }

      if (mediaUrl) {
        messageData.media_url = mediaUrl;
        messageData.media_type = mediaType;
      }

      const { error } = await supabase.from("internal_messages").insert(messageData);

      if (error) {
        console.error("Error sending message:", error);
        throw new Error(error.message || "Erro ao enviar mensagem");
      }

      setMessageText("");

      // Reload messages after sending
      if (selectedTeam) {
        await loadTeamMessages();
      } else if (selectedUser) {
        await loadMessages();
      }

      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMediaSelect = (url: string, type: string) => {
    handleSend(url, type);
  };

  const handleAudioRecorded = (url: string) => {
    handleSend(url, "audio");
  };

  const handleStickerSelect = (sticker: string) => {
    setMessageText(messageText + sticker);
  };

  const handleTyping = () => {
    sendTypingIndicator();
  };

  const filteredUsers = users.filter((u: UserWithRoles) =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineCount = users.filter(u => u.isOnline).length;

  // Loading skeleton component
  const UserSkeleton = () => (
    <div className="p-3 border-b">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card h-14 flex items-center px-4 justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Chat Interno</h1>
          {!loading && (
            <Badge variant="secondary" className="ml-2">
              {onlineCount} online
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleRefresh} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <Button variant="outline" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r flex flex-col bg-card">
          {/* Super Admin Tenant Selector */}
          {isSuperAdmin && (
            <div className="p-3 border-b bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Empresa</span>
              </div>
              <Select value={selectedTenantId || ""} onValueChange={setSelectedTenantId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            </Tabs>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === "users" && (
              <div className="h-full">
                {loading ? (
                  // Loading state
                  <>
                    <UserSkeleton />
                    <UserSkeleton />
                    <UserSkeleton />
                    <UserSkeleton />
                  </>
                ) : filteredUsers.length === 0 ? (
                  // Empty state
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <UsersIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {searchTerm ? "Nenhum usuário encontrado" : "Nenhum outro usuário"}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {searchTerm 
                        ? "Tente outro termo de busca" 
                        : "Convide membros para sua equipe"}
                    </p>
                    {!searchTerm && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => navigate("/admin/users")}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Convidar Usuários
                      </Button>
                    )}
                  </div>
                ) : (
                  // User list
                  filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedUser?.id === u.id ? "bg-muted" : ""
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
                          {u.isOnline && (
                            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm truncate block">
                              {u.full_name || "Sem nome"}
                            </span>
                            {u.unreadCount && u.unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-2 h-5 min-w-5 flex items-center justify-center text-xs">
                                {u.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <OnlineStatus isOnline={u.isOnline || false} status={u.status} />
                            {u.phone && (
                              <span className="text-xs text-foreground/60 truncate">{u.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "teams" && (
              <div className="h-full space-y-2 p-2">
                <Button
                  onClick={() => {
                    if (!tenantId) {
                      toast({
                        title: "Aguarde",
                        description: "Carregando informações do tenant...",
                        variant: "destructive",
                      });
                      return;
                    }
                    setShowTeamDialog(true);
                  }}
                  className="w-full"
                  size="sm"
                  disabled={!tenantId}
                >
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Criar Nova Equipe
                </Button>
                {loading ? (
                  <>
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </>
                ) : teams.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <UsersIcon className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma equipe criada</p>
                    <p className="text-xs text-muted-foreground/70">Crie equipes para chat em grupo</p>
                  </div>
                ) : (
                  teams.map((team) => (
                    <div
                      key={team.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedTeam?.id === team.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer"
                          onClick={() => setSelectedTeam(team)}
                        >
                          <UsersIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => setSelectedTeam(team)}>
                          <span className="font-medium text-sm truncate block">{team.name}</span>
                          {team.description && (
                            <span className="text-xs text-foreground/60 truncate block">
                              {team.description}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTeam({ id: team.id, name: team.name });
                            setShowTeamMembersDialog(true);
                          }}
                          className="h-8 px-2"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "config" && tenantId && (
              <div className="p-4 h-full overflow-y-auto">
                <ChatConfigTab tenantId={tenantId} />
              </div>
            )}

            {activeTab === "config" && !tenantId && (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Settings className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Selecione uma empresa</p>
              </div>
            )}
          </div>

          {tenantId && (
            <>
              <TeamDialog
                open={showTeamDialog}
                onOpenChange={setShowTeamDialog}
                tenantId={tenantId}
                onSuccess={() => {
                  setShowTeamDialog(false);
                  loadTeams();
                }}
              />
              <TeamMembersDialog
                open={showTeamMembersDialog}
                onOpenChange={setShowTeamMembersDialog}
                team={editingTeam}
                tenantId={tenantId}
                onSuccess={() => {
                  setShowTeamMembersDialog(false);
                  setEditingTeam(null);
                  loadTeams();
                }}
              />
            </>
          )}
        </div>

        {/* Área de Chat */}
        {selectedUser || selectedTeam ? (
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
                      <OnlineStatus isOnline={selectedUser.isOnline || false} status={selectedUser.status} />
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
                    <div key={msg.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border"
                        }`}
                      >
                        {showSenderName && (
                          <p className="text-xs font-semibold mb-1 text-primary">
                            {msg.sender?.full_name || "Usuário"}
                          </p>
                        )}
                        {msg.media_url && (
                          <div className="mb-2">
                            {msg.media_type === "image" ? (
                              <img src={msg.media_url} alt="Mídia" className="rounded-lg max-w-full" />
                            ) : msg.media_type === "audio" ? (
                              <audio controls src={msg.media_url} className="max-w-full" />
                            ) : (
                              <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                                Ver arquivo
                              </a>
                            )}
                          </div>
                        )}
                        <p className="text-sm break-words">{msg.content}</p>
                        <span className={`text-xs mt-1 block ${isOwnMessage ? "opacity-80" : "text-foreground/60"}`}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {typingUsers.length > 0 && <TypingIndicator userName={typingUsers[0]} />}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4 bg-card shadow-lg">
              <div className="flex gap-2 items-center">
                <MediaUpload onMediaSelect={handleMediaSelect} />
                <AudioRecorder onAudioRecorded={handleAudioRecorded} />
                <StickerPicker onStickerSelect={handleStickerSelect} />
                <Input
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Digite sua mensagem..."
                  disabled={sendingMessage}
                  className="flex-1 bg-background"
                />
                <Button
                  onClick={() => handleSend()}
                  size="icon"
                  disabled={sendingMessage || (!messageText.trim())}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center text-foreground/60 max-w-sm">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="h-10 w-10 opacity-50" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Selecione uma conversa</h3>
              <p className="text-sm">Escolha um usuário ou equipe na lista ao lado para começar a conversar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
