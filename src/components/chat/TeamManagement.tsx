import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Team {
  id: string;
  name: string;
  description: string;
}

interface TeamManagementProps {
  tenantId: string;
}

export function TeamManagement({ tenantId }: TeamManagementProps) {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeams();
    loadUsers();
  }, [tenantId]);

  const loadTeams = async () => {
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

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a equipe",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: newTeam, error: teamError } = await supabase
        .from("teams")
        .insert({
          tenant_id: tenantId,
          name: teamName,
          description: teamDescription,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      if (selectedUsers.length > 0) {
        const members = selectedUsers.map((userId) => ({
          team_id: newTeam.id,
          user_id: userId,
        }));

        const { error: membersError } = await supabase
          .from("team_members")
          .insert(members);

        if (membersError) throw membersError;
      }

      toast({
        title: "Equipe criada",
        description: "Equipe criada com sucesso",
      });

      setTeamName("");
      setTeamDescription("");
      setSelectedUsers([]);
      setOpen(false);
      loadTeams();
    } catch (error: any) {
      toast({
        title: "Erro ao criar equipe",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Deseja realmente excluir esta equipe?")) return;

    try {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId);

      if (error) throw error;

      toast({
        title: "Equipe excluída",
        description: "Equipe removida com sucesso",
      });

      loadTeams();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir equipe",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Equipes de Chat
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Equipe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Equipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Nome da Equipe</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ex: Suporte Técnico"
                />
              </div>
              <div>
                <Label htmlFor="team-description">Descrição</Label>
                <Textarea
                  id="team-description"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Descrição da equipe..."
                />
              </div>
              <div>
                <Label>Membros</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                          }
                        }}
                      />
                      <span className="text-sm">{user.full_name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateTeam} disabled={loading} className="w-full">
                {loading ? "Criando..." : "Criar Equipe"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {teams.map((team) => (
          <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">{team.name}</h4>
              {team.description && (
                <p className="text-sm text-muted-foreground">{team.description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteTeam(team.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
