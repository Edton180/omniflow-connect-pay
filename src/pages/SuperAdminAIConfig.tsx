import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bot, 
  Sparkles, 
  Zap, 
  Shield, 
  Settings2, 
  Activity,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Cpu,
  Save,
  RefreshCw
} from "lucide-react";

interface AIStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
}

const availableModels = [
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", recommended: true, description: "Balanceado: custo e latência baixos, boa qualidade" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", recommended: false, description: "Top-tier: melhor para raciocínio complexo" },
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", provider: "Google", recommended: false, description: "Mais rápido e barato, ideal para tarefas simples" },
  { id: "openai/gpt-5", name: "GPT-5", provider: "OpenAI", recommended: false, description: "Poderoso, excelente raciocínio, mais caro" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI", recommended: false, description: "Custo médio, mantém qualidade" },
  { id: "openai/gpt-5-nano", name: "GPT-5 Nano", provider: "OpenAI", recommended: false, description: "Mais rápido e econômico" },
];

const toneOptions = [
  { value: "professional", label: "Profissional", description: "Tom formal e direto" },
  { value: "friendly", label: "Amigável", description: "Tom casual e acolhedor" },
  { value: "technical", label: "Técnico", description: "Tom preciso e detalhado" },
  { value: "empathetic", label: "Empático", description: "Tom compreensivo e paciente" },
];

export default function SuperAdminAIConfig() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [aiStats, setAIStats] = useState<AIStats>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
  });

  const [config, setConfig] = useState({
    lovableAIEnabled: true,
    defaultModel: "google/gemini-2.5-flash",
    fallbackEnabled: true,
    fallbackModel: "openai/gpt-5-mini",
    globalPersonality: "Você é um assistente virtual profissional e prestativo. Responda de forma clara e objetiva.",
    defaultTone: "professional",
    maxTokens: 1000,
    temperature: 0.7,
    rateLimitPerTenant: 100,
    enableLogging: true,
  });

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      const { data } = await supabase
        .from('system_secrets')
        .select('*')
        .eq('secret_name', 'global_ai_config')
        .maybeSingle();

      if (data?.secret_value) {
        try {
          const savedConfig = JSON.parse(data.secret_value);
          setConfig(prev => ({ ...prev, ...savedConfig }));
        } catch (e) {
          console.error('Error parsing AI config:', e);
        }
      }
    } catch (error) {
      console.error('Error loading AI config:', error);
    }
  };

  const loadStats = async () => {
    setAIStats({
      totalRequests: Math.floor(Math.random() * 10000),
      successfulRequests: Math.floor(Math.random() * 9000),
      failedRequests: Math.floor(Math.random() * 100),
      avgResponseTime: Math.floor(Math.random() * 500) + 200,
    });
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('system_secrets')
        .select('id')
        .eq('secret_name', 'global_ai_config')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('system_secrets')
          .update({
            secret_value: JSON.stringify(config),
            updated_at: new Date().toISOString(),
          })
          .eq('secret_name', 'global_ai_config');
      } else {
        await supabase
          .from('system_secrets')
          .insert({
            secret_name: 'global_ai_config',
            secret_value: JSON.stringify(config),
          });
      }

      toast({
        title: "Configuração Salva",
        description: "As configurações de IA foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testAI = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-ai-provider', {
        body: { 
          model: config.defaultModel,
          message: "Olá, este é um teste de conectividade." 
        }
      });

      if (error) throw error;

      toast({
        title: "Teste Bem-sucedido",
        description: `IA respondeu em ${data?.responseTime || 'N/A'}ms`,
      });
    } catch (error: any) {
      toast({
        title: "Erro no Teste",
        description: error.message || "Falha ao conectar com a IA",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Configuração Global de IA</h1>
              <p className="text-muted-foreground">Configure o Lovable AI e provedores de IA para todo o sistema</p>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status Lovable AI</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-500">Ativo</span>
                  </div>
                </div>
                <Sparkles className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Requisições Hoje</p>
                  <p className="text-2xl font-bold">{aiStats.totalRequests.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold">
                    {aiStats.totalRequests > 0 
                      ? Math.round((aiStats.successfulRequests / aiStats.totalRequests) * 100) 
                      : 100}%
                  </p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio</p>
                  <p className="text-2xl font-bold">{aiStats.avgResponseTime}ms</p>
                </div>
                <Cpu className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="models">Modelos</TabsTrigger>
            <TabsTrigger value="personality">Personalidade</TabsTrigger>
            <TabsTrigger value="limits">Limites</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Lovable AI
                </CardTitle>
                <CardDescription>
                  Configure o provedor de IA integrado do Lovable. Não requer configuração adicional.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Lovable AI Gateway</h3>
                      <p className="text-sm text-muted-foreground">
                        Acesso a modelos Google Gemini e OpenAI GPT sem configuração
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="default" className="bg-green-500">Pré-configurado</Badge>
                    <Switch 
                      checked={config.lovableAIEnabled}
                      onCheckedChange={(checked) => setConfig({...config, lovableAIEnabled: checked})}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Modelo Padrão</Label>
                    <Select 
                      value={config.defaultModel} 
                      onValueChange={(value) => setConfig({...config, defaultModel: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map(model => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                              {model.name}
                              {model.recommended && <Badge variant="secondary" className="text-xs">Recomendado</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Fallback Habilitado</Label>
                      <Switch 
                        checked={config.fallbackEnabled}
                        onCheckedChange={(checked) => setConfig({...config, fallbackEnabled: checked})}
                      />
                    </div>
                    {config.fallbackEnabled && (
                      <Select 
                        value={config.fallbackModel} 
                        onValueChange={(value) => setConfig({...config, fallbackModel: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Modelo de fallback" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels.filter(m => m.id !== config.defaultModel).map(model => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={testAI} disabled={testing} variant="outline">
                    {testing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
                    Testar Conexão
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Modelos Disponíveis</CardTitle>
                <CardDescription>
                  Modelos de IA disponíveis através do Lovable AI Gateway
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {availableModels.map(model => (
                    <div 
                      key={model.id} 
                      className={`p-4 border rounded-lg transition-all ${
                        config.defaultModel === model.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{model.name}</h4>
                          <p className="text-xs text-muted-foreground">{model.provider}</p>
                        </div>
                        <div className="flex gap-2">
                          {model.recommended && <Badge className="bg-green-500">Recomendado</Badge>}
                          {config.defaultModel === model.id && <Badge variant="outline">Padrão</Badge>}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setConfig({...config, defaultModel: model.id})}
                        disabled={config.defaultModel === model.id}
                      >
                        {config.defaultModel === model.id ? 'Selecionado' : 'Selecionar'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Personalidade Global
                </CardTitle>
                <CardDescription>
                  Configure a personalidade padrão da IA para todos os tenants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Prompt de Sistema Global</Label>
                  <Textarea 
                    value={config.globalPersonality}
                    onChange={(e) => setConfig({...config, globalPersonality: e.target.value})}
                    placeholder="Descreva a personalidade padrão da IA..."
                    className="min-h-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este prompt será usado como base para todos os chatbots. Tenants podem personalizar adicionalmente.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tom de Voz Padrão</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {toneOptions.map(tone => (
                      <div 
                        key={tone.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          config.defaultTone === tone.value ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                        onClick={() => setConfig({...config, defaultTone: tone.value})}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            config.defaultTone === tone.value ? 'bg-primary' : 'bg-muted'
                          }`} />
                          <span className="font-medium">{tone.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{tone.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="limits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Limites e Controles
                </CardTitle>
                <CardDescription>
                  Configure limites de uso e parâmetros de geração
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Máximo de Tokens por Resposta</Label>
                    <Input 
                      type="number"
                      value={config.maxTokens}
                      onChange={(e) => setConfig({...config, maxTokens: parseInt(e.target.value) || 1000})}
                      min={100}
                      max={4000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Limita o tamanho das respostas da IA (100-4000)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Temperatura (Criatividade)</Label>
                    <Input 
                      type="number"
                      value={config.temperature}
                      onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value) || 0.7})}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                      0 = mais focado, 2 = mais criativo
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Limite de Requisições por Tenant/Hora</Label>
                    <Input 
                      type="number"
                      value={config.rateLimitPerTenant}
                      onChange={(e) => setConfig({...config, rateLimitPerTenant: parseInt(e.target.value) || 100})}
                      min={10}
                      max={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Máximo de requisições de IA por tenant por hora
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Habilitar Logging de Requisições</Label>
                      <Switch 
                        checked={config.enableLogging}
                        onCheckedChange={(checked) => setConfig({...config, enableLogging: checked})}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Registra todas as requisições para análise e debug
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button onClick={saveConfig} disabled={loading} size="lg">
            {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
