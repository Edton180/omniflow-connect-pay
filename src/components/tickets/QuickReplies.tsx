import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface QuickReply {
  id: string;
  tenant_id: string;
  shortcut: string;
  message: string;
  created_at: string;
}

interface QuickRepliesProps {
  onSelectReply: (message: string) => void;
  tenantId: string;
}

export function QuickReplies({ onSelectReply, tenantId }: QuickRepliesProps) {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newShortcut, setNewShortcut] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (tenantId) {
      loadReplies();
    }
  }, [tenantId]);

  const loadReplies = async () => {
    try {
      const { data, error } = await supabase
        .from("quick_replies")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("shortcut");

      if (error) throw error;
      setReplies(data || []);
    } catch (error: any) {
      console.error("Error loading quick replies:", error);
    }
  };

  const handleAddReply = async () => {
    if (!newShortcut || !newMessage) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o atalho e a mensagem",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("quick_replies")
        .insert({
          tenant_id: tenantId,
          shortcut: newShortcut,
          message: newMessage,
        });

      if (error) throw error;

      toast({
        title: "Resposta rápida criada",
        description: "Use /" + newShortcut + " para inserir",
      });

      setNewShortcut("");
      setNewMessage("");
      setIsAddingNew(false);
      loadReplies();
    } catch (error: any) {
      toast({
        title: "Erro ao criar resposta rápida",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteReply = async (id: string) => {
    try {
      const { error } = await supabase
        .from("quick_replies")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Resposta rápida deletada",
      });

      loadReplies();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Respostas rápidas">
          <MessageSquare className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Respostas Rápidas</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!isAddingNew && (
            <Button onClick={() => setIsAddingNew(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Nova Resposta Rápida
            </Button>
          )}

          {isAddingNew && (
            <Card className="p-4 space-y-3">
              <div className="space-y-2">
                <Label>Atalho (sem espaços)</Label>
                <Input
                  placeholder="Ex: saudacao"
                  value={newShortcut}
                  onChange={(e) => setNewShortcut(e.target.value.toLowerCase().replace(/\s/g, ""))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Digite a mensagem que será enviada"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddReply}>Salvar</Button>
                <Button variant="outline" onClick={() => {
                  setIsAddingNew(false);
                  setNewShortcut("");
                  setNewMessage("");
                }}>
                  Cancelar
                </Button>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            {replies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma resposta rápida configurada
              </p>
            ) : (
              replies.map((reply) => (
                <Card key={reply.id} className="p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 cursor-pointer" onClick={() => {
                      onSelectReply(reply.message);
                      setIsOpen(false);
                    }}>
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono bg-primary/10 px-2 py-0.5 rounded">
                          /{reply.shortcut}
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground">{reply.message}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteReply(reply.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
