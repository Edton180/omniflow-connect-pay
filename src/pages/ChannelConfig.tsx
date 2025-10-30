import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Settings, Clock, GitBranch } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BusinessHoursConfig } from "@/components/channels/BusinessHoursConfig";
import { MenuBuilder } from "@/components/channels/MenuBuilder";

interface ChatbotConfig {
  greeting_message: string;
  timeout_message: string;
  offline_message: string;
  timeout_seconds: number;
  is_active: boolean;
}

export default function ChannelConfig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<any>(null);
  const [chatbotConfig, setChatbotConfig] = useState<ChatbotConfig>({
    greeting_message: "Olá! Bem-vindo ao nosso atendimento. Como posso ajudar?",
    timeout_message: "Desculpe, não recebi sua resposta. Por favor, tente novamente.",
    offline_message: "No momento estamos fora do horário de atendimento. Retornaremos em breve!",
    timeout_seconds: 60,
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      loadChannel();
    }
  }, [id, session]);

  const loadChannel = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setChannel(data);

      // Carregar configurações do chatbot
      if (data?.chatbot_config && typeof data.chatbot_config === 'object') {
        const config = data.chatbot_config as any;
        setChatbotConfig({
          greeting_message: config.greeting_message || chatbotConfig.greeting_message,
          timeout_message: config.timeout_message || chatbotConfig.timeout_message,
          offline_message: config.offline_message || chatbotConfig.offline_message,
          timeout_seconds: config.timeout_seconds || chatbotConfig.timeout_seconds,
          is_active: config.is_active !== undefined ? config.is_active : chatbotConfig.is_active,
        });
      }
    } catch (error: any) {
      console.error("Error loading channel:", error);
      toast.error("Erro ao carregar canal");
    }
  };

  const saveChatbotConfig = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("channels")
        .update({ chatbot_config: chatbotConfig as any })
        .eq("id", id);

      if (error) throw error;
      toast.success("Configurações do chatbot salvas com sucesso!");
    } catch (error: any) {
      console.error("Error saving chatbot config:", error);
      toast.error("Erro ao salvar configurações: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!channel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/channels")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white shadow-glow">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Configurar Canal: {channel.name}</h1>
              <p className="text-xs text-muted-foreground">
                Configure comportamento, horários e menus do canal
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="behavior" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="behavior">
              <Settings className="h-4 w-4 mr-2" />
              Comportamento
            </TabsTrigger>
            <TabsTrigger value="hours">
              <Clock className="h-4 w-4 mr-2" />
              Horários
            </TabsTrigger>
            <TabsTrigger value="menus">
              <GitBranch className="h-4 w-4 mr-2" />
              Menus & Roteamento
            </TabsTrigger>
          </TabsList>

          {/* Bloco A - Fluxo e Chatbot */}
          <TabsContent value="behavior" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Fluxo e Chatbot</CardTitle>
                <CardDescription>
                  Configure mensagens automáticas e comportamento do chatbot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="greeting">Mensagem de Saudação</Label>
                  <Textarea
                    id="greeting"
                    placeholder="Digite a mensagem inicial..."
                    value={chatbotConfig.greeting_message}
                    onChange={(e) =>
                      setChatbotConfig({ ...chatbotConfig, greeting_message: e.target.value })
                    }
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta mensagem será enviada quando o cliente iniciar uma conversa
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">Mensagem de Timeout</Label>
                  <Textarea
                    id="timeout"
                    placeholder="Mensagem quando o usuário não responder..."
                    value={chatbotConfig.timeout_message}
                    onChange={(e) =>
                      setChatbotConfig({ ...chatbotConfig, timeout_message: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offline">Mensagem Fora de Horário</Label>
                  <Textarea
                    id="offline"
                    placeholder="Mensagem quando estiver fora do horário..."
                    value={chatbotConfig.offline_message}
                    onChange={(e) =>
                      setChatbotConfig({ ...chatbotConfig, offline_message: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout_seconds">Tempo de Timeout (segundos)</Label>
                  <Input
                    id="timeout_seconds"
                    type="number"
                    min="30"
                    max="300"
                    value={chatbotConfig.timeout_seconds}
                    onChange={(e) =>
                      setChatbotConfig({
                        ...chatbotConfig,
                        timeout_seconds: parseInt(e.target.value) || 60,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo que o sistema aguarda resposta do usuário (30-300 segundos)
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="chatbot_active"
                    checked={chatbotConfig.is_active}
                    onCheckedChange={(checked) =>
                      setChatbotConfig({ ...chatbotConfig, is_active: checked })
                    }
                  />
                  <Label htmlFor="chatbot_active">Chatbot Ativo</Label>
                </div>

                <Button onClick={saveChatbotConfig} disabled={loading} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bloco B - Disponibilidade */}
          <TabsContent value="hours" className="space-y-6">
            <BusinessHoursConfig channelId={id!} />
          </TabsContent>

          {/* Bloco C - Menus & Roteamento */}
          <TabsContent value="menus" className="space-y-6">
            <MenuBuilder channelId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
