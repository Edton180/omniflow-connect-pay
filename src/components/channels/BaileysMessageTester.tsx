import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BaileysMessageTesterProps {
  channel: any;
}

export function BaileysMessageTester({ channel }: BaileysMessageTesterProps) {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || !message) {
      toast.error("Preencha número e mensagem");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('baileys-whatsapp', {
        body: {
          action: 'send',
          channelId: channel.id,
          to: phoneNumber,
          message: message,
        },
      });

      if (error) throw error;

      toast.success('Mensagem enviada com sucesso!');
      setMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="gradient-card">
      <CardHeader>
        <CardTitle>Testar Envio de Mensagem</CardTitle>
        <CardDescription>
          Envie uma mensagem de teste via Baileys
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número do Destinatário</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+5511999999999"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Formato: código do país + DDD + número (ex: +5511999999999)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              disabled={loading}
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
                Enviar Mensagem
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
