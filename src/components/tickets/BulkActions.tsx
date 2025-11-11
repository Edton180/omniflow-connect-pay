import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Check, X, Archive, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BulkActionsProps {
  tickets: any[];
  selectedTickets: string[];
  onSelectionChange: (ticketIds: string[]) => void;
  onComplete: () => void;
}

export const BulkActions = ({
  tickets,
  selectedTickets,
  onSelectionChange,
  onComplete,
}: BulkActionsProps) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSelectAll = () => {
    if (selectedTickets.length === tickets.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(tickets.map(t => t.id));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedTickets.length === 0) return;

    setProcessing(true);
    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'closed') {
        updates.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("tickets")
        .update(updates)
        .in("id", selectedTickets);

      if (error) throw error;

      toast({
        title: "Tickets atualizados",
        description: `${selectedTickets.length} tickets foram atualizados com sucesso.`,
      });

      onSelectionChange([]);
      onComplete();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar tickets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0) return;
    if (!confirm(`Tem certeza que deseja deletar ${selectedTickets.length} tickets?`)) return;

    setProcessing(true);
    try {
      // Delete messages first
      await supabase
        .from("messages")
        .delete()
        .in("ticket_id", selectedTickets);

      // Delete tickets
      const { error } = await supabase
        .from("tickets")
        .delete()
        .in("id", selectedTickets);

      if (error) throw error;

      toast({
        title: "Tickets deletados",
        description: `${selectedTickets.length} tickets foram removidos com sucesso.`,
      });

      onSelectionChange([]);
      onComplete();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar tickets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (tickets.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg mb-2">
      <Checkbox
        checked={selectedTickets.length === tickets.length && tickets.length > 0}
        onCheckedChange={handleSelectAll}
      />
      <span className="text-sm text-muted-foreground">
        {selectedTickets.length > 0 ? (
          <Badge variant="secondary">{selectedTickets.length} selecionados</Badge>
        ) : (
          "Selecionar todos"
        )}
      </span>

      {selectedTickets.length > 0 && (
        <div className="flex items-center gap-1 ml-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkStatusChange('closed')}
            disabled={processing}
          >
            <Check className="h-3 w-3 mr-1" />
            Fechar
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={processing}>
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleBulkStatusChange('open')}>
                <Check className="h-3 w-3 mr-2" />
                Marcar como Aberto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatusChange('pending')}>
                <Archive className="h-3 w-3 mr-2" />
                Marcar como Pendente
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleBulkDelete}
                className="text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Deletar Selecionados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSelectionChange([])}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
