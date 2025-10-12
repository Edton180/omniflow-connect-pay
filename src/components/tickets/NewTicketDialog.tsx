import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewTicketDialog = ({ open, onOpenChange }: NewTicketDialogProps) => {
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    contact_id: "",
    queue_id: "",
    channel: "whatsapp",
    priority: "medium",
    initial_message: "",
  });

  useEffect(() => {
    if (open) {
      fetchContacts();
      fetchQueues();
    }
  }, [open]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, phone")
        .order("name");

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
    }
  };

  const fetchQueues = async () => {
    try {
      const { data, error } = await supabase
        .from("queues")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setQueues(data || []);
    } catch (error: any) {
      console.error("Error fetching queues:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ticketData = {
        tenant_id: profile?.tenant_id,
        contact_id: formData.contact_id,
        queue_id: formData.queue_id || null,
        channel: formData.channel,
        priority: formData.priority,
        status: "open",
        last_message: formData.initial_message || null,
        assigned_to: user?.id,
      };

      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert([ticketData])
        .select()
        .single();

      if (ticketError) throw ticketError;

      if (formData.initial_message) {
        const { error: messageError } = await supabase.from("messages").insert([
          {
            ticket_id: ticket.id,
            contact_id: formData.contact_id,
            content: formData.initial_message,
            is_from_contact: true,
          },
        ]);

        if (messageError) throw messageError;
      }

      toast({
        title: "Ticket criado",
        description: "O ticket foi criado com sucesso.",
      });

      onOpenChange(false);
      navigate(`/tickets/${ticket.id}`);
    } catch (error: any) {
      toast({
        title: "Erro ao criar ticket",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo Ticket</DialogTitle>
          <DialogDescription>Crie um novo ticket de atendimento</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact">Contato *</Label>
            <Select
              value={formData.contact_id}
              onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um contato" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} {contact.phone && `- ${contact.phone}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="channel">Canal *</Label>
              <Select
                value={formData.channel}
                onValueChange={(value) => setFormData({ ...formData, channel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="webchat">Web Chat</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="queue">Fila</Label>
            <Select
              value={formData.queue_id}
              onValueChange={(value) => setFormData({ ...formData, queue_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma fila (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {queues.map((queue) => (
                  <SelectItem key={queue.id} value={queue.id}>
                    {queue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial_message">Mensagem Inicial</Label>
            <Textarea
              id="initial_message"
              value={formData.initial_message}
              onChange={(e) => setFormData({ ...formData, initial_message: e.target.value })}
              rows={4}
              placeholder="Digite a mensagem inicial do contato..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
