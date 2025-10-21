import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

interface MessageTesterProps {
  channel: any;
}

export function MessageTester({ channel }: MessageTesterProps) {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || !message) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      let functionName = "";
      let body: any = {};

      switch (channel.type) {
        case "telegram":
          functionName = "send-telegram-message";
          body = {
            chatId: phoneNumber,
            message: message,
          };
          break;
        case "waba":
          functionName = "send-waba-message";
          body = {
            to: phoneNumber,
            message: message,
          };
          break;
        case "facebook":
        case "instagram":
          functionName = "send-facebook-message";
          body = {
            recipientId: phoneNumber,
            message: message,
            platform: channel.type,
          };
          break;
        case "evolution":
          functionName = "send-evolution-message";
          body = {
            to: phoneNumber,
            message: message,
          };
          break;
        default:
          throw new Error("Tipo de canal não suportado");
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
      });

      if (error) throw error;

      toast.success("Mensagem de teste enviada com sucesso!");
      setPhoneNumber("");
      setMessage("");
    } catch (error: any) {
      console.error("Error sending test message:", error);
      toast.error(error.message || "Erro ao enviar mensagem de teste");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testar Envio de Mensagem</CardTitle>
        <CardDescription>
          Envie uma mensagem de teste para validar a integração
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendTest} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">
              {channel.type === "telegram" ? "Chat ID" : "Número/ID do Destinatário"}
            </Label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={
                channel.type === "telegram"
                  ? "123456789"
                  : channel.type === "waba"
                  ? "5511999999999"
                  : "ID do destinatário"
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              {channel.type === "telegram" &&
                "Para obter seu Chat ID, envie uma mensagem para @userinfobot"}
              {channel.type === "waba" &&
                "Digite o número com código do país (ex: 5511999999999)"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem de teste..."
              rows={4}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Teste
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}