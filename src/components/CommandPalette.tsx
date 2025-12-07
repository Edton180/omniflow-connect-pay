import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Ticket,
  Users,
  Settings,
  LogOut,
  Plus,
  BarChart3,
  MessageSquare,
  FolderKanban,
  Zap,
  FileText,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSuperAdmin, hasRole } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
  };

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Digite um comando ou busque..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        <CommandGroup heading="Navegação">
          <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/view-tickets"))}>
            <Ticket className="mr-2 h-4 w-4" />
            <span>Atendimentos</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/contacts"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Contatos</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/crm"))}>
            <FolderKanban className="mr-2 h-4 w-4" />
            <span>CRM</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/internal-chat"))}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Chat Interno</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Relatórios">
          <CommandItem onSelect={() => runCommand(() => navigate("/agent-reports"))}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Relatórios de Agentes</span>
          </CommandItem>
          {/* Relatórios Financeiros apenas para Super Admin */}
          {isSuperAdmin && (
            <CommandItem onSelect={() => runCommand(() => navigate("/financial-reports"))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Relatórios Financeiros</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações Rápidas">
          <CommandItem onSelect={() => runCommand(() => navigate("/view-tickets?new=true"))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Novo Ticket</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/contacts?new=true"))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Novo Contato</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Sistema">
          <CommandItem onSelect={() => runCommand(() => navigate("/tenant/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </CommandItem>
          {/* Logs de Auditoria apenas para Super Admin */}
          {isSuperAdmin && (
            <CommandItem onSelect={() => runCommand(() => navigate("/audit-logs"))}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Logs de Auditoria</span>
            </CommandItem>
          )}
          <CommandItem onSelect={() => runCommand(handleLogout)}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
