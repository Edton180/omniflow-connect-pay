import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Filter } from "lucide-react";

interface TicketFiltersProps {
  queues: Array<{ id: string; name: string; color: string }>;
  selectedQueue: string;
  onQueueChange: (queueId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedPriority?: string;
  onPriorityChange?: (priority: string) => void;
}

export const TicketFilters = ({
  queues,
  selectedQueue,
  onQueueChange,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
}: TicketFiltersProps) => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-xs">Status</Label>
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger id="status-filter" className="h-9">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="closed">Fechados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="queue-filter" className="text-xs">Fila de Atendimento</Label>
            <Select value={selectedQueue} onValueChange={onQueueChange}>
              <SelectTrigger id="queue-filter" className="h-9">
                <SelectValue placeholder="Todas as filas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as filas</SelectItem>
                {queues.map((queue) => (
                  <SelectItem key={queue.id} value={queue.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 w-2 rounded-full" 
                        style={{ backgroundColor: queue.color }}
                      />
                      {queue.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {onPriorityChange && (
            <div className="space-y-2">
              <Label htmlFor="priority-filter" className="text-xs">Prioridade</Label>
              <Select 
                value={selectedPriority || "all"} 
                onValueChange={onPriorityChange}
              >
                <SelectTrigger id="priority-filter" className="h-9">
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
