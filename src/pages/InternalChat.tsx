import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, Send, Users as UsersIcon, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function InternalChat() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!userRole?.tenant_id) return;

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSend = () => {
    if (!messageText.trim()) return;
    // Implementar lógica de envio aqui
    setMessageText("");
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users" className="text-xs">
                  <UsersIcon className="h-3 w-3 mr-1" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger value="teams" className="text-xs">
                  Equipes
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-y-auto">
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
          </div>
        </div>

        {/* Área de Chat */}
        {selectedUser ? (
          <div className="flex-1 flex flex-col">
            <div className="border-b p-4 bg-card">
              <div className="flex items-center gap-3">
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
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">Nenhuma mensagem ainda</p>
                <p className="text-xs">Seja o primeiro a enviar uma mensagem</p>
              </div>
            </div>

            <div className="border-t p-4 bg-card">
              <div className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Digite sua mensagem..."
                />
                <Button onClick={handleSend} size="icon">
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