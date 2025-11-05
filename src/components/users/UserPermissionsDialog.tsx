import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentPermissions?: Record<string, boolean>;
  onSuccess?: () => void;
}

const AVAILABLE_PERMISSIONS = [
  { id: "dashboard", label: "Dashboard", description: "Visualizar painel principal" },
  { id: "tickets", label: "Tickets", description: "Gerenciar atendimentos" },
  { id: "contacts", label: "Contatos", description: "Gerenciar contatos" },
  { id: "channels", label: "Canais", description: "Configurar canais de atendimento" },
  { id: "queues", label: "Filas", description: "Gerenciar filas" },
  { id: "crm", label: "CRM", description: "Acessar Kanban/CRM" },
  { id: "internal_chat", label: "Chat Interno", description: "Chat entre equipes" },
  { id: "reports", label: "Relatórios", description: "Ver relatórios e métricas" },
  { id: "users", label: "Usuários", description: "Gerenciar usuários" },
  { id: "settings", label: "Configurações", description: "Configurações do tenant" },
];

export function UserPermissionsDialog({
  open,
  onOpenChange,
  userId,
  userName,
  currentPermissions = {},
  onSuccess,
}: UserPermissionsDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    currentPermissions
  );

  const handleToggle = (permissionId: string) => {
    setPermissions((prev) => ({
      ...prev,
      [permissionId]: !prev[permissionId],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update user metadata with permissions
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          permissions,
        },
      });

      if (error) throw error;

      toast({
        title: "Permissões atualizadas",
        description: `Permissões de ${userName} foram atualizadas com sucesso.`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar permissões",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Permissões</DialogTitle>
          <DialogDescription>
            Configure as permissões de acesso para {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {AVAILABLE_PERMISSIONS.map((perm) => (
            <div
              key={perm.id}
              className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={perm.id}
                checked={permissions[perm.id] || false}
                onCheckedChange={() => handleToggle(perm.id)}
              />
              <div className="flex-1">
                <Label
                  htmlFor={perm.id}
                  className="text-sm font-medium cursor-pointer"
                >
                  {perm.label}
                </Label>
                <p className="text-xs text-muted-foreground">{perm.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Permissões
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
