import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin,
  BarChart3,
  ListOrdered,
  Send,
  Plus,
  Loader2,
  MessageSquare,
  Phone,
  FileText,
} from "lucide-react";

interface ChannelActionsProps {
  channel: string;
  chatId: string;
  phoneNumber?: string;
  ticketId: string;
  onMessageSent?: () => void;
}

export function ChannelActions({
  channel,
  chatId,
  phoneNumber,
  ticketId,
  onMessageSent,
}: ChannelActionsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Location dialog
  const [locationOpen, setLocationOpen] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationName, setLocationName] = useState("");
  
  // Poll dialog (Telegram only)
  const [pollOpen, setPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  
  // Buttons dialog
  const [buttonsOpen, setButtonsOpen] = useState(false);
  const [buttonMessage, setButtonMessage] = useState("");
  const [buttons, setButtons] = useState<Array<{ title: string; payload?: string }>>([
    { title: "" },
  ]);

  // List dialog (WhatsApp only)
  const [listOpen, setListOpen] = useState(false);
  const [listMessage, setListMessage] = useState("");
  const [listButtonText, setListButtonText] = useState("Ver opções");
  const [listSections, setListSections] = useState<Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>>([{ title: "Opções", rows: [{ id: "1", title: "", description: "" }] }]);

  const sendTypingIndicator = async () => {
    try {
      if (channel === "telegram") {
        await supabase.functions.invoke("send-telegram-message", {
          body: { chatId, type: "action", action: "typing" },
        });
      } else if (channel === "facebook" || channel === "instagram") {
        await supabase.functions.invoke("send-facebook-message", {
          body: { recipientId: chatId, type: "action", action: "typing_on", platform: channel },
        });
      }
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  };

  const handleSendLocation = async () => {
    if (!latitude || !longitude) {
      toast({ title: "Preencha latitude e longitude", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await sendTypingIndicator();
      
      let functionName = "";
      let body: any = {};

      if (channel === "telegram") {
        functionName = "send-telegram-message";
        body = {
          chatId,
          type: "location",
          location: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          },
        };
      } else if (channel === "whatsapp") {
        functionName = "send-waba-message";
        body = {
          to: phoneNumber,
          type: "location",
          location: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            name: locationName || undefined,
          },
        };
      }

      const { error } = await supabase.functions.invoke(functionName, { body });
      
      if (error) throw error;

      // Save message to database
      await supabase.from("messages").insert({
        ticket_id: ticketId,
        content: `📍 Localização: ${latitude}, ${longitude}${locationName ? ` (${locationName})` : ""}`,
        is_from_contact: false,
        status: "sent",
      });

      toast({ title: "Localização enviada!" });
      setLocationOpen(false);
      setLatitude("");
      setLongitude("");
      setLocationName("");
      onMessageSent?.();
    } catch (error: any) {
      toast({ title: "Erro ao enviar localização", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPoll = async () => {
    if (!pollQuestion || pollOptions.filter(o => o.trim()).length < 2) {
      toast({ title: "Preencha a pergunta e pelo menos 2 opções", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await sendTypingIndicator();

      const { error } = await supabase.functions.invoke("send-telegram-message", {
        body: {
          chatId,
          type: "poll",
          poll: {
            question: pollQuestion,
            options: pollOptions.filter(o => o.trim()),
          },
        },
      });

      if (error) throw error;

      await supabase.from("messages").insert({
        ticket_id: ticketId,
        content: `📊 Enquete: ${pollQuestion}\n${pollOptions.filter(o => o.trim()).map((o, i) => `${i + 1}. ${o}`).join("\n")}`,
        is_from_contact: false,
        status: "sent",
      });

      toast({ title: "Enquete enviada!" });
      setPollOpen(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      onMessageSent?.();
    } catch (error: any) {
      toast({ title: "Erro ao enviar enquete", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendButtons = async () => {
    const validButtons = buttons.filter(b => b.title.trim());
    if (!buttonMessage.trim() || validButtons.length === 0) {
      toast({ title: "Preencha a mensagem e pelo menos um botão", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await sendTypingIndicator();

      let functionName = "";
      let body: any = {};

      if (channel === "telegram") {
        functionName = "send-telegram-message";
        body = {
          chatId,
          message: buttonMessage,
          buttons: validButtons.map(b => ({ text: b.title, callback_data: b.payload || b.title })),
        };
      } else if (channel === "whatsapp") {
        functionName = "send-waba-message";
        body = {
          to: phoneNumber,
          message: buttonMessage,
          type: "interactive",
          buttons: validButtons.slice(0, 3).map((b, i) => ({ id: `btn_${i}`, title: b.title })),
        };
      } else if (channel === "facebook" || channel === "instagram") {
        functionName = "send-facebook-message";
        body = {
          recipientId: chatId,
          message: buttonMessage,
          type: "template",
          templateType: "button",
          buttons: validButtons.slice(0, 3).map(b => ({ type: "postback", title: b.title, payload: b.payload || b.title })),
          platform: channel,
        };
      }

      const { error } = await supabase.functions.invoke(functionName, { body });
      if (error) throw error;

      await supabase.from("messages").insert({
        ticket_id: ticketId,
        content: `${buttonMessage}\n\n🔘 ${validButtons.map(b => b.title).join(" | ")}`,
        is_from_contact: false,
        status: "sent",
      });

      toast({ title: "Mensagem com botões enviada!" });
      setButtonsOpen(false);
      setButtonMessage("");
      setButtons([{ title: "" }]);
      onMessageSent?.();
    } catch (error: any) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendList = async () => {
    const validSections = listSections.filter(s => s.rows.some(r => r.title.trim()));
    if (!listMessage.trim() || validSections.length === 0) {
      toast({ title: "Preencha a mensagem e pelo menos uma opção", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await sendTypingIndicator();

      const { error } = await supabase.functions.invoke("send-waba-message", {
        body: {
          to: phoneNumber,
          message: listMessage,
          type: "interactive",
          listButtonText,
          listSections: validSections.map(s => ({
            title: s.title,
            rows: s.rows.filter(r => r.title.trim()),
          })),
        },
      });

      if (error) throw error;

      await supabase.from("messages").insert({
        ticket_id: ticketId,
        content: `${listMessage}\n\n📝 Lista: ${validSections.flatMap(s => s.rows.map(r => r.title)).join(", ")}`,
        is_from_contact: false,
        status: "sent",
      });

      toast({ title: "Lista enviada!" });
      setListOpen(false);
      setListMessage("");
      setListSections([{ title: "Opções", rows: [{ id: "1", title: "", description: "" }] }]);
      onMessageSent?.();
    } catch (error: any) {
      toast({ title: "Erro ao enviar lista", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Determine which actions are available for each channel
  const showLocation = ["telegram", "whatsapp"].includes(channel);
  const showPoll = channel === "telegram";
  const showButtons = ["telegram", "whatsapp", "facebook", "instagram"].includes(channel);
  const showList = channel === "whatsapp";

  if (!showLocation && !showPoll && !showButtons && !showList) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Ações
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showLocation && (
            <DropdownMenuItem onClick={() => setLocationOpen(true)}>
              <MapPin className="h-4 w-4 mr-2" />
              Enviar Localização
            </DropdownMenuItem>
          )}
          {showPoll && (
            <DropdownMenuItem onClick={() => setPollOpen(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Criar Enquete
            </DropdownMenuItem>
          )}
          {showButtons && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setButtonsOpen(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Mensagem com Botões
              </DropdownMenuItem>
            </>
          )}
          {showList && (
            <DropdownMenuItem onClick={() => setListOpen(true)}>
              <ListOrdered className="h-4 w-4 mr-2" />
              Enviar Lista
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Location Dialog */}
      <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Enviar Localização
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="-23.5505"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="-46.6333"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nome do Local (opcional)</Label>
              <Input
                placeholder="Ex: Escritório Central"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocationOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendLocation} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Poll Dialog */}
      <Dialog open={pollOpen} onOpenChange={setPollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Criar Enquete
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Input
                placeholder="Qual sua cor favorita?"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Opções</Label>
              {pollOptions.map((option, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Opção ${i + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...pollOptions];
                      newOptions[i] = e.target.value;
                      setPollOptions(newOptions);
                    }}
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {pollOptions.length < 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Opção
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPollOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendPoll} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buttons Dialog */}
      <Dialog open={buttonsOpen} onOpenChange={setButtonsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mensagem com Botões
            </DialogTitle>
            <DialogDescription>
              {channel === "whatsapp" ? "Máximo 3 botões" : channel === "telegram" ? "Sem limite de botões" : "Máximo 3 botões"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Digite a mensagem..."
                value={buttonMessage}
                onChange={(e) => setButtonMessage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Botões</Label>
              {buttons.map((btn, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Botão ${i + 1}`}
                    value={btn.title}
                    onChange={(e) => {
                      const newButtons = [...buttons];
                      newButtons[i] = { ...newButtons[i], title: e.target.value };
                      setButtons(newButtons);
                    }}
                  />
                  {buttons.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setButtons(buttons.filter((_, idx) => idx !== i))}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {buttons.length < (channel === "telegram" ? 10 : 3) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setButtons([...buttons, { title: "" }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Botão
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setButtonsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendButtons} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* List Dialog (WhatsApp only) */}
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5" />
              Enviar Lista Interativa
            </DialogTitle>
            <DialogDescription>
              Crie uma lista de opções para o cliente selecionar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Escolha uma das opções abaixo:"
                value={listMessage}
                onChange={(e) => setListMessage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto do Botão</Label>
              <Input
                placeholder="Ver opções"
                value={listButtonText}
                onChange={(e) => setListButtonText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Itens da Lista</Label>
              {listSections[0].rows.map((row, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder={`Item ${i + 1}`}
                      value={row.title}
                      onChange={(e) => {
                        const newSections = [...listSections];
                        newSections[0].rows[i].title = e.target.value;
                        setListSections(newSections);
                      }}
                    />
                    <Input
                      placeholder="Descrição (opcional)"
                      value={row.description || ""}
                      onChange={(e) => {
                        const newSections = [...listSections];
                        newSections[0].rows[i].description = e.target.value;
                        setListSections(newSections);
                      }}
                    />
                  </div>
                  {listSections[0].rows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newSections = [...listSections];
                        newSections[0].rows = newSections[0].rows.filter((_, idx) => idx !== i);
                        setListSections(newSections);
                      }}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {listSections[0].rows.length < 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newSections = [...listSections];
                    newSections[0].rows.push({ 
                      id: String(newSections[0].rows.length + 1), 
                      title: "", 
                      description: "" 
                    });
                    setListSections(newSections);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendList} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
