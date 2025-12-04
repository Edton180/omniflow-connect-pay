import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, UserPlus, UserMinus, Loader2 } from "lucide-react";

interface TeamMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: { id: string; name: string } | null;
  tenantId: string;
  onSuccess: () => void;
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  isMember: boolean;
}

export function TeamMembersDialog({ open, onOpenChange, team, tenantId, onSuccess }: TeamMembersDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && team && tenantId) {
      loadUsersAndMembers();
    }
  }, [open, team, tenantId]);

  const loadUsersAndMembers = async () => {
    if (!team || !tenantId) return;
    
    setLoading(true);
    try {
      // Get all users from tenant
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("tenant_id", tenantId);

      if (profilesError) throw profilesError;

      // Get current team members
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", team.id);

      if (membersError) throw membersError;

      const memberIds = new Set(members?.map(m => m.user_id) || []);
      
      const usersWithMembership = (profiles || []).map(profile => ({
        ...profile,
        isMember: memberIds.has(profile.id),
      }));

      setUsers(usersWithMembership);
      setSelectedUsers(memberIds);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!team) return;

    setSaving(true);
    try {
      // Get current members
      const { data: currentMembers } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", team.id);

      const currentMemberIds = new Set(currentMembers?.map(m => m.user_id) || []);
      
      // Find users to add and remove
      const toAdd: string[] = [];
      const toRemove: string[] = [];

      selectedUsers.forEach(userId => {
        if (!currentMemberIds.has(userId)) {
          toAdd.push(userId);
        }
      });

      currentMemberIds.forEach(userId => {
        if (!selectedUsers.has(userId)) {
          toRemove.push(userId);
        }
      });

      // Remove members
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from("team_members")
          .delete()
          .eq("team_id", team.id)
          .in("user_id", toRemove);

        if (removeError) throw removeError;
      }

      // Add members
      if (toAdd.length > 0) {
        const { error: addError } = await supabase
          .from("team_members")
          .insert(toAdd.map(userId => ({
            team_id: team.id,
            user_id: userId,
          })));

        if (addError) throw addError;
      }

      toast({
        title: "Membros atualizados",
        description: `${toAdd.length} adicionado(s), ${toRemove.length} removido(s)`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar membros",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const memberCount = selectedUsers.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Membros
          </DialogTitle>
          <DialogDescription>
            {team?.name} - {memberCount} membro(s) selecionado(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px] border rounded-lg">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-4 w-4" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {users.length === 0 
                  ? "Nenhum usuário encontrado neste tenant"
                  : "Nenhum usuário corresponde à pesquisa"
                }
              </div>
            ) : (
              <div className="p-2">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.has(user.id)
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleToggleUser(user.id)}
                  >
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => handleToggleUser(user.id)}
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{user.full_name || "Sem nome"}</p>
                    </div>
                    {user.isMember && !selectedUsers.has(user.id) && (
                      <Badge variant="outline" className="text-xs text-destructive">
                        <UserMinus className="h-3 w-3 mr-1" />
                        Será removido
                      </Badge>
                    )}
                    {!user.isMember && selectedUsers.has(user.id) && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Será adicionado
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
