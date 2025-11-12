import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, ArrowRight, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";

interface TicketQuickActionsProps {
  onStatusChange: (status: string) => void;
  onForward: () => void;
  onDelete: () => void;
  currentStatus: string;
}

export function TicketQuickActions({
  onStatusChange,
  onForward,
  onDelete,
  currentStatus,
}: TicketQuickActionsProps) {
  const statusActions = [
    { value: "open", label: "Abrir", icon: Clock, show: currentStatus !== "open" },
    { value: "in_progress", label: "Em Atendimento", icon: Clock, show: currentStatus !== "in_progress" },
    { value: "pending", label: "Pendente", icon: Clock, show: currentStatus !== "pending" },
    { value: "resolved", label: "Resolver", icon: CheckCircle, show: currentStatus !== "resolved" },
    { value: "closed", label: "Fechar", icon: XCircle, show: currentStatus !== "closed" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Ações Rápidas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onForward} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          Encaminhar
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
        
        {statusActions.filter(action => action.show).map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.value}
              onClick={() => onStatusChange(action.value)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={onDelete}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
