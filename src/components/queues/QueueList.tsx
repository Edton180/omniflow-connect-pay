import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Plus, Pencil, Trash2, Clock, Users } from "lucide-react";
import { QueueDialog } from "./QueueDialog";
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

export const QueueList = () => {
  const { toast } = useToast();
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [queueToDelete, setQueueToDelete] = useState<any>(null);

  const fetchQueues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("queues")
        .select("*")
        .order("name");

      if (error) throw error;
      setQueues(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar filas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  const handleCreate = () => {
    setSelectedQueue(null);
    setDialogOpen(true);
  };

  const handleEdit = (queue: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedQueue(queue);
    setDialogOpen(true);
  };

  const handleDeleteClick = (queue: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setQueueToDelete(queue);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!queueToDelete) return;

    try {
      const { error } = await supabase
        .from("queues")
        .delete()
        .eq("id", queueToDelete.id);

      if (error) throw error;

      toast({
        title: "Fila excluída",
        description: "A fila foi excluída com sucesso.",
      });

      fetchQueues();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir fila",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setQueueToDelete(null);
    }
  };

  const filteredQueues = queues.filter(queue =>
    queue.name?.toLowerCase().includes(search.toLowerCase()) ||
    queue.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar filas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Fila
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredQueues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhuma fila encontrada</p>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? "Tente ajustar sua busca" : "Crie sua primeira fila de atendimento"}
            </p>
            {!search && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Fila
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQueues.map((queue) => (
            <Card key={queue.id} className="gradient-card hover-scale">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: queue.color }}
                    >
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{queue.name}</CardTitle>
                      {queue.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {queue.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={(e) => handleEdit(queue, e)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={(e) => handleDeleteClick(queue, e)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">SLA</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{queue.sla_minutes} min</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={queue.is_active ? "default" : "secondary"}>
                    {queue.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QueueDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        queue={selectedQueue}
        onSuccess={fetchQueues}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a fila <strong>{queueToDelete?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
