import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

interface TelegramQRLoginProps {
  channelId: string;
  tenantId: string;
  onSuccess?: () => void;
}

export const TelegramQRLogin = ({ channelId, tenantId, onSuccess }: TelegramQRLoginProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("idle");
  const [botToken, setBotToken] = useState("");

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      setStatus("pending");

      const { data, error } = await supabase.functions.invoke("telegram-qr-login", {
        body: {
          action: "generate",
          channelId,
          tenantId,
        },
      });

      if (error) throw error;

      setQrCodeUrl(data.qrCodeUrl);
      setSessionId(data.sessionId);
      setExpiresAt(data.expiresAt);

      toast.success("QR Code gerado! Escaneie com o Telegram.");

      // Iniciar verificação automática
      startStatusCheck(data.sessionId);
    } catch (error) {
      console.error("Erro ao gerar QR code:", error);
      toast.error("Erro ao gerar QR code");
    } finally {
      setIsLoading(false);
    }
  };

  const startStatusCheck = (sid: string) => {
    const checkInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("telegram-qr-login", {
          body: {
            action: "check",
            sessionId: sid,
          },
        });

        if (error) throw error;

        setStatus(data.status);

        if (data.status === "accepted") {
          clearInterval(checkInterval);
          toast.success("Login realizado com sucesso!");
          onSuccess?.();
        } else if (data.status === "expired") {
          clearInterval(checkInterval);
          toast.error("QR Code expirado. Gere um novo.");
          setQrCodeUrl("");
        }
      } catch (error) {
        console.error("Erro ao verificar status:", error);
        clearInterval(checkInterval);
      }
    }, 2000);

    // Limpar após 35 segundos (mais que os 30 de expiração)
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 35000);
  };

  const handleManualLogin = async () => {
    if (!botToken.trim()) {
      toast.error("Por favor, insira o token do bot");
      return;
    }

    try {
      setIsLoading(true);

      // Atualizar canal diretamente com o token
      const { error } = await supabase
        .from("channels")
        .update({
          config: { bot_token: botToken },
          status: "active",
        })
        .eq("id", channelId);

      if (error) throw error;

      toast.success("Bot conectado com sucesso!");
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao conectar bot:", error);
      toast.error("Erro ao conectar bot");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateQRCode();
  }, []);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Login via QR Code</h3>
            <p className="text-sm text-muted-foreground">
              Escaneie o QR code com seu aplicativo Telegram
            </p>
          </div>

          {qrCodeUrl && status === "pending" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCode value={qrCodeUrl} size={200} />
              </div>

              <div className="text-sm text-muted-foreground text-center">
                {expiresAt && (
                  <p>Expira em: {new Date(expiresAt).toLocaleTimeString()}</p>
                )}
                <p className="mt-2">Aguardando confirmação...</p>
              </div>

              <Button
                variant="outline"
                onClick={generateQRCode}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Gerar Novo QR Code
              </Button>
            </div>
          )}

          {isLoading && !qrCodeUrl && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {status === "accepted" && (
            <div className="text-center text-green-600 font-medium">
              ✅ Login realizado com sucesso!
            </div>
          )}

          {status === "expired" && (
            <div className="text-center space-y-4">
              <p className="text-destructive">QR Code expirado</p>
              <Button onClick={generateQRCode} disabled={isLoading}>
                Gerar Novo QR Code
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Login Manual</h3>
            <p className="text-sm text-muted-foreground">
              Ou conecte-se usando o token do bot
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="botToken">Token do Bot</Label>
            <Input
              id="botToken"
              type="password"
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Obtenha seu token com o @BotFather no Telegram
            </p>
          </div>

          <Button
            onClick={handleManualLogin}
            disabled={isLoading || !botToken.trim()}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Conectar Bot
          </Button>
        </div>
      </Card>
    </div>
  );
};