import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Bot, Plus, Pencil, Trash2, Sparkles, MessageSquare, Zap, ArrowRightLeft, Brain, Save, Key } from "lucide-react";

interface ChatbotIntent {
  id: string;
  name: string;
  description: string | null;
  examples: string[];
  response: string | null;
  action: string;
  confidence_threshold: number;
  is_active: boolean;
}

interface ChatbotSettingsData {
  id?: string;
  is_active: boolean;
  default_confidence_threshold: number;
  fallback_message: string;
  transfer_message: string;
  welcome_message: string;
  enabled_channels: string[];
  ai_provider: string;
}

interface AIConfig {
  id?: string;
  provider: 'openai' | 'google' | 'xai';
  api_key_encrypted: string;
  is_active: boolean;
}

export default function ChatbotSettings() {
  const { roles } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAI, setSavingAI] = useState(false);
  const [intents, setIntents] = useState<ChatbotIntent[]>([]);
  const [settings, setSettings] = useState<ChatbotSettingsData>({
    is_active: false,
    default_confidence_threshold: 0.7,
    fallback_message: "Não entendi sua mensagem. Vou transferir você para um atendente.",
    transfer_message: "Aguarde um momento, estou transferindo você para um atendente.",
    welcome_message: "Olá! Sou o assistente virtual. Como posso ajudar?",
    enabled_channels: ["telegram", "whatsapp", "webchat"],
    ai_provider: "lovable"
  });
  const [aiConfigs, setAiConfigs] = useState<Record<string, AIConfig>>({
    openai: { provider: 'openai', api_key_encrypted: '', is_active: false },
    google: { provider: 'google', api_key_encrypted: '', is_active: false },
    xai: { provider: 'xai', api_key_encrypted: '', is_active: false },
  });
  
  const [intentDialogOpen, setIntentDialogOpen] = useState(false);
  const [editingIntent, setEditingIntent] = useState<ChatbotIntent | null>(null);
  const [intentForm, setIntentForm] = useState({
    name: "",
    description: "",
    examples: "",
    response: "",
    action: "respond",
    confidence_threshold: 0.8,
    is_active: true
  });

  const tenantId = roles.find(r => r.tenant_id)?.tenant_id;

  useEffect(() => {
    if (tenantId) loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) return;
    setLoading(true);

    const [settingsRes, intentsRes, aiConfigsRes] = await Promise.all([
      supabase
        .from("chatbot_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle(),
      supabase
        .from("chatbot_intents")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name"),
      supabase
        .from("ai_configs")
        .select("*")
        .eq("tenant_id", tenantId)
    ]);

    if (settingsRes.data) {
      setSettings({
        id: settingsRes.data.id,
        is_active: settingsRes.data.is_active,
        default_confidence_threshold: Number(settingsRes.data.default_confidence_threshold),
        fallback_message: settingsRes.data.fallback_message || "",
        transfer_message: settingsRes.data.transfer_message || "",
        welcome_message: settingsRes.data.welcome_message || "",
        enabled_channels: settingsRes.data.enabled_channels as string[] || [],
        ai_provider: settingsRes.data.ai_provider || "lovable"
      });
    }

    if (intentsRes.data) {
      setIntents(intentsRes.data.map(i => ({
        ...i,
        examples: i.examples as string[] || [],
        confidence_threshold: Number(i.confidence_threshold)
      })));
    }

    if (aiConfigsRes.data) {
      const configMap: Record<string, AIConfig> = { ...aiConfigs };
      aiConfigsRes.data.forEach((config) => {
        configMap[config.provider] = config as AIConfig;
      });
      setAiConfigs(configMap);
    }

    setLoading(false);
  };

  const saveSettings = async () => {
    if (!tenantId) return;
    setSaving(true);

    try {
      if (settings.id) {
        await supabase
          .from("chatbot_settings")
          .update({
            is_active: settings.is_active,
            default_confidence_threshold: settings.default_confidence_threshold,
            fallback_message: settings.fallback_message,
            transfer_message: settings.transfer_message,
            welcome_message: settings.welcome_message,
            enabled_channels: settings.enabled_channels,
            ai_provider: settings.ai_provider
          })
          .eq("id", settings.id);
      } else {
        const { data } = await supabase
          .from("chatbot_settings")
          .insert({
            tenant_id: tenantId,
            is_active: settings.is_active,
            default_confidence_threshold: settings.default_confidence_threshold,
            fallback_message: settings.fallback_message,
            transfer_message: settings.transfer_message,
            welcome_message: settings.welcome_message,
            enabled_channels: settings.enabled_channels,
            ai_provider: settings.ai_provider
          })
          .select()
          .single();
        
        if (data) setSettings(prev => ({ ...prev, id: data.id }));
      }
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const saveAIConfig = async (provider: 'openai' | 'google' | 'xai') => {
    if (!tenantId) {
      toast.error('Tenant não identificado');
      return;
    }

    const config = aiConfigs[provider];
    if (!config.api_key_encrypted.trim()) {
      toast.error('Por favor, insira a API Key');
      return;
    }

    setSavingAI(true);
    try {
      const configData = {
        tenant_id: tenantId,
        provider,
        api_key_encrypted: config.api_key_encrypted,
        is_active: config.is_active,
      };

      if (config.id) {
        const { error } = await supabase
          .from('ai_configs')
          .update(configData)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ai_configs').insert(configData);
        if (error) throw error;
      }

      toast.success('Configuração de IA salva com sucesso!');
      await loadData();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSavingAI(false);
    }
  };

  const openIntentDialog = (intent?: ChatbotIntent) => {
    if (intent) {
      setEditingIntent(intent);
      setIntentForm({
        name: intent.name,
        description: intent.description || "",
        examples: intent.examples.join("\n"),
        response: intent.response || "",
        action: intent.action,
        confidence_threshold: intent.confidence_threshold,
        is_active: intent.is_active
      });
    } else {
      setEditingIntent(null);
      setIntentForm({
        name: "",
        description: "",
        examples: "",
        response: "",
        action: "respond",
        confidence_threshold: 0.8,
        is_active: true
      });
    }
    setIntentDialogOpen(true);
  };

  const saveIntent = async () => {
    if (!tenantId) return;

    const examples = intentForm.examples.split("\n").filter(e => e.trim());
    
    try {
      if (editingIntent) {
        await supabase
          .from("chatbot_intents")
          .update({
            name: intentForm.name,
            description: intentForm.description,
            examples,
            response: intentForm.response,
            action: intentForm.action,
            confidence_threshold: intentForm.confidence_threshold,
            is_active: intentForm.is_active
          })
          .eq("id", editingIntent.id);
        toast.success("Intenção atualizada!");
      } else {
        await supabase
          .from("chatbot_intents")
          .insert({
            tenant_id: tenantId,
            name: intentForm.name,
            description: intentForm.description,
            examples,
            response: intentForm.response,
            action: intentForm.action,
            confidence_threshold: intentForm.confidence_threshold,
            is_active: intentForm.is_active
          });
        toast.success("Intenção criada!");
      }
      
      setIntentDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error("Erro ao salvar intenção");
    }
  };

  const deleteIntent = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta intenção?")) return;
    
    try {
      await supabase.from("chatbot_intents").delete().eq("id", id);
      toast.success("Intenção excluída!");
      loadData();
    } catch (error) {
      toast.error("Erro ao excluir intenção");
    }
  };

  const toggleChannel = (channel: string) => {
    setSettings(prev => ({
      ...prev,
      enabled_channels: prev.enabled_channels.includes(channel)
        ? prev.enabled_channels.filter(c => c !== channel)
        : [...prev.enabled_channels, channel]
    }));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Chatbot com IA</h1>
              <p className="text-muted-foreground">Configure o atendimento automático inicial</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="intents" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Intenções
            </TabsTrigger>
            <TabsTrigger value="ai-providers" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Provedores de IA
            </TabsTrigger>
          </TabsList>

          {/* Tab Configurações */}
          <TabsContent value="settings" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Configurações Gerais */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Configurações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Chatbot Ativo</Label>
                      <p className="text-sm text-muted-foreground">Ativar atendimento automático</p>
                    </div>
                    <Switch
                      checked={settings.is_active}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Confiança Mínima ({Math.round(settings.default_confidence_threshold * 100)}%)</Label>
                    <Slider
                      value={[settings.default_confidence_threshold * 100]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, default_confidence_threshold: value / 100 }))}
                      max={100}
                      min={50}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Confiança mínima para resposta automática
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Canais Habilitados</Label>
                    <div className="flex flex-wrap gap-2">
                      {["telegram", "whatsapp", "webchat", "email"].map(channel => (
                        <Badge
                          key={channel}
                          variant={settings.enabled_channels.includes(channel) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleChannel(channel)}
                        >
                          {channel.charAt(0).toUpperCase() + channel.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Provedor de IA</Label>
                    <Select 
                      value={settings.ai_provider} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, ai_provider: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lovable">
                          <span className="flex items-center gap-2">
                            Lovable AI (Padrão)
                          </span>
                        </SelectItem>
                        <SelectItem 
                          value="openai" 
                          disabled={!aiConfigs.openai?.is_active}
                        >
                          <span className="flex items-center gap-2">
                            OpenAI ChatGPT
                            {!aiConfigs.openai?.is_active && (
                              <Badge variant="outline" className="text-xs">Não configurado</Badge>
                            )}
                          </span>
                        </SelectItem>
                        <SelectItem 
                          value="google" 
                          disabled={!aiConfigs.google?.is_active}
                        >
                          <span className="flex items-center gap-2">
                            Google Gemini
                            {!aiConfigs.google?.is_active && (
                              <Badge variant="outline" className="text-xs">Não configurado</Badge>
                            )}
                          </span>
                        </SelectItem>
                        <SelectItem 
                          value="xai" 
                          disabled={!aiConfigs.xai?.is_active}
                        >
                          <span className="flex items-center gap-2">
                            xAI Grok
                            {!aiConfigs.xai?.is_active && (
                              <Badge variant="outline" className="text-xs">Não configurado</Badge>
                            )}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Configure as API Keys na aba "Provedores de IA"
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Mensagens */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Mensagens do Chatbot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mensagem de Boas-vindas</Label>
                    <Textarea
                      value={settings.welcome_message}
                      onChange={(e) => setSettings(prev => ({ ...prev, welcome_message: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagem de Fallback</Label>
                    <Textarea
                      value={settings.fallback_message}
                      onChange={(e) => setSettings(prev => ({ ...prev, fallback_message: e.target.value }))}
                      placeholder="Quando não entender a mensagem..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagem de Transferência</Label>
                    <Textarea
                      value={settings.transfer_message}
                      onChange={(e) => setSettings(prev => ({ ...prev, transfer_message: e.target.value }))}
                      placeholder="Quando transferir para agente..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Intenções */}
          <TabsContent value="intents" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Intenções do Chatbot
                  </CardTitle>
                  <CardDescription>Configure as respostas automáticas por intenção</CardDescription>
                </div>
                <Button onClick={() => openIntentDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Intenção
                </Button>
              </CardHeader>
              <CardContent>
                {intents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma intenção configurada.</p>
                    <p className="text-sm">Adicione intenções para o chatbot responder automaticamente.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Confiança</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {intents.map(intent => (
                        <TableRow key={intent.id}>
                          <TableCell className="font-medium">{intent.name}</TableCell>
                          <TableCell className="text-muted-foreground">{intent.description || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {intent.action === "respond" ? "Responder" : 
                               intent.action === "transfer" ? "Transferir" : intent.action}
                            </Badge>
                          </TableCell>
                          <TableCell>{Math.round(intent.confidence_threshold * 100)}%</TableCell>
                          <TableCell>
                            <Badge variant={intent.is_active ? "default" : "secondary"}>
                              {intent.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openIntentDialog(intent)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteIntent(intent.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Provedores de IA */}
          <TabsContent value="ai-providers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  OpenAI (ChatGPT)
                </CardTitle>
                <CardDescription>Configure a API Key do OpenAI para usar GPT-4, GPT-5, etc.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai-key">API Key</Label>
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={aiConfigs.openai.api_key_encrypted}
                    onChange={(e) =>
                      setAiConfigs({
                        ...aiConfigs,
                        openai: { ...aiConfigs.openai, api_key_encrypted: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="openai-active"
                      checked={aiConfigs.openai.is_active}
                      onCheckedChange={(checked) =>
                        setAiConfigs({ ...aiConfigs, openai: { ...aiConfigs.openai, is_active: checked } })
                      }
                    />
                    <Label htmlFor="openai-active">Ativar OpenAI</Label>
                  </div>
                  <Button onClick={() => saveAIConfig('openai')} disabled={savingAI}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Google Gemini
                </CardTitle>
                <CardDescription>Configure a API Key do Google para usar Gemini Pro, Flash, etc.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google-key">API Key</Label>
                  <Input
                    id="google-key"
                    type="password"
                    placeholder="AIza..."
                    value={aiConfigs.google.api_key_encrypted}
                    onChange={(e) =>
                      setAiConfigs({
                        ...aiConfigs,
                        google: { ...aiConfigs.google, api_key_encrypted: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="google-active"
                      checked={aiConfigs.google.is_active}
                      onCheckedChange={(checked) =>
                        setAiConfigs({ ...aiConfigs, google: { ...aiConfigs.google, is_active: checked } })
                      }
                    />
                    <Label htmlFor="google-active">Ativar Gemini</Label>
                  </div>
                  <Button onClick={() => saveAIConfig('google')} disabled={savingAI}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  xAI Grok
                </CardTitle>
                <CardDescription>Configure a API Key do xAI para usar Grok</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="xai-key">API Key</Label>
                  <Input
                    id="xai-key"
                    type="password"
                    placeholder="xai-..."
                    value={aiConfigs.xai.api_key_encrypted}
                    onChange={(e) =>
                      setAiConfigs({
                        ...aiConfigs,
                        xai: { ...aiConfigs.xai, api_key_encrypted: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="xai-active"
                      checked={aiConfigs.xai.is_active}
                      onCheckedChange={(checked) =>
                        setAiConfigs({ ...aiConfigs, xai: { ...aiConfigs.xai, is_active: checked } })
                      }
                    />
                    <Label htmlFor="xai-active">Ativar Grok</Label>
                  </div>
                  <Button onClick={() => saveAIConfig('xai')} disabled={savingAI}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para criar/editar intenção */}
        <Dialog open={intentDialogOpen} onOpenChange={setIntentDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingIntent ? "Editar Intenção" : "Nova Intenção"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={intentForm.name}
                    onChange={(e) => setIntentForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: saudação"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ação</Label>
                  <Select 
                    value={intentForm.action}
                    onValueChange={(value) => setIntentForm(prev => ({ ...prev, action: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="respond">Responder</SelectItem>
                      <SelectItem value="transfer">Transferir para Agente</SelectItem>
                      <SelectItem value="menu">Mostrar Menu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={intentForm.description}
                  onChange={(e) => setIntentForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição da intenção"
                />
              </div>

              <div className="space-y-2">
                <Label>Exemplos de Frases (uma por linha)</Label>
                <Textarea
                  value={intentForm.examples}
                  onChange={(e) => setIntentForm(prev => ({ ...prev, examples: e.target.value }))}
                  placeholder="Olá&#10;Oi&#10;Bom dia&#10;Boa tarde"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Resposta</Label>
                <Textarea
                  value={intentForm.response}
                  onChange={(e) => setIntentForm(prev => ({ ...prev, response: e.target.value }))}
                  placeholder="Olá! Como posso ajudar?"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1 mr-4">
                  <Label>Confiança Mínima ({Math.round(intentForm.confidence_threshold * 100)}%)</Label>
                  <Slider
                    value={[intentForm.confidence_threshold * 100]}
                    onValueChange={([value]) => setIntentForm(prev => ({ ...prev, confidence_threshold: value / 100 }))}
                    max={100}
                    min={50}
                    step={5}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={intentForm.is_active}
                    onCheckedChange={(checked) => setIntentForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Ativo</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIntentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveIntent}>
                {editingIntent ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}