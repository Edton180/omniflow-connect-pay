import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

interface TeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  onSuccess: () => void;
}

export function TeamDialog({ open, onOpenChange, tenantId, onSuccess }: TeamDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          tenant_id: tenantId,
          name: formData.name,
          description: formData.description,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add current user as team member
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: memberError } = await supabase
          .from("team_members")
          .insert({
            team_id: team.id,
            user_id: user.id,
          });

        if (memberError) throw memberError;
      }

      toast({
        title: "Equipe criada",
        description: "A equipe foi criada com sucesso.",
      });

      setFormData({ name: "", description: "" });
      onSuccess();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Criar Nova Equipe
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Equipe</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Suporte Técnico"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o propósito desta equipe..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Equipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
