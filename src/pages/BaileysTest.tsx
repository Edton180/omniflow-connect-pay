import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BaileysConnection } from "@/components/channels/BaileysConnection";
import { BaileysMessageTester } from "@/components/channels/BaileysMessageTester";
import { BaileysSetupGuide } from "@/components/channels/BaileysSetupGuide";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

export default function BaileysTest() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("type", "baileys-qr")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error("Error loading channels:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const connectedChannel = channels.find(c => c.status === 'active');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/channels")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white shadow-glow">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Teste Baileys WhatsApp</h1>
              <p className="text-xs text-muted-foreground">
                Conexão e teste via QR Code
              </p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <BaileysSetupGuide />
            
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  Carregando...
                </CardContent>
              </Card>
            ) : channels.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center space-y-3">
                  <QrCode className="w-16 h-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold mb-2">Nenhum canal Baileys encontrado</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crie um canal WhatsApp (Baileys QR) primeiro
                    </p>
                    <Button onClick={() => navigate("/channels")}>
                      Ir para Canais
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              channels.map(channel => (
                <BaileysConnection
                  key={channel.id}
                  channel={channel}
                  onStatusChange={() => loadChannels()}
                />
              ))
            )}
          </div>

          <div>
            {connectedChannel ? (
              <BaileysMessageTester channel={connectedChannel} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Conecte um canal Baileys primeiro para testar o envio de mensagens
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
