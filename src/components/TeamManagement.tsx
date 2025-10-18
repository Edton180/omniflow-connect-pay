import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TeamDialog } from "./chat/TeamDialog";
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

interface TeamManagementProps {
  tenantId: string;
}

export function TeamManagement({ tenantId }: TeamManagementProps) {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<any>(null);

  useEffect(() => {
    if (tenantId) {
      fetchTeams();
    }
  }, [tenantId]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select(`
          *,
          team_members (
            id,
            user_id,
            profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (error: any) {
      console.error("Error fetching teams:", error);
      toast.error("Erro ao carregar equipes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setDialogOpen(true);
  };

  const handleEdit = (_team: any) => {
    toast.info("Edição de equipe em desenvolvimento");
  };

  const handleDeleteClick = (team: any) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!teamToDelete) return;

    try {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamToDelete.id);

      if (error) throw error;
      toast.success("Equipe excluída com sucesso!");
      fetchTeams();
    } catch (error: any) {
      console.error("Error deleting team:", error);
      toast.error("Erro ao excluir equipe");
    } finally {
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">Carregando equipes...</div>
        </CardContent>
      </Card>
    );
  }

  if (teams.length === 0) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Equipes</CardTitle>
            <CardDescription>
              Crie equipes para organizar conversas em grupo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma equipe criada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie sua primeira equipe para começar
              </p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Equipe
              </Button>
            </div>
          </CardContent>
        </Card>
        <TeamDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          tenantId={tenantId}
          onSuccess={fetchTeams}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Equipes</h2>
          <p className="text-sm text-muted-foreground">Gerencie equipes e membros</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Equipe
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  {team.description && (
                    <CardDescription className="mt-2">{team.description}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {team.team_members?.length || 0} membros
                </span>
              </div>

              {team.team_members && team.team_members.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {team.team_members.slice(0, 3).map((member: any) => (
                    <Badge key={member.id} variant="secondary" className="text-xs">
                      {member.profiles?.full_name || "Sem nome"}
                    </Badge>
                  ))}
                  {team.team_members.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{team.team_members.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(team)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(team)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TeamDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tenantId={tenantId}
        onSuccess={fetchTeams}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a equipe "{teamToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
