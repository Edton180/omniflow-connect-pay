import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, Wand2, FileText, Languages, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MessageAssistantTabProps {
  tenantId: string | null;
  onNavigateToProviders?: () => void;
}

interface AssistantSettings {
  suggestions_enabled: boolean;
  suggestions_tone: string;
  suggestions_count: number;
  auto_improve_enabled: boolean;
  auto_summary_enabled: boolean;
  auto_translate_enabled: boolean;
}

export function MessageAssistantTab({ tenantId, onNavigateToProviders }: MessageAssistantTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AssistantSettings>({
    suggestions_enabled: true,
    suggestions_tone: 'professional',
    suggestions_count: 3,
    auto_improve_enabled: true,
    auto_summary_enabled: true,
    auto_translate_enabled: false,
  });

  useEffect(() => {
    if (tenantId) {
      loadSettings();
    }
  }, [tenantId]);

  const loadSettings = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chatbot_settings')
        .select('suggestions_enabled, suggestions_tone, suggestions_count, auto_improve_enabled, auto_summary_enabled, auto_translate_enabled')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          suggestions_enabled: data.suggestions_enabled ?? true,
          suggestions_tone: data.suggestions_tone ?? 'professional',
          suggestions_count: data.suggestions_count ?? 3,
          auto_improve_enabled: data.auto_improve_enabled ?? true,
          auto_summary_enabled: data.auto_summary_enabled ?? true,
          auto_translate_enabled: data.auto_translate_enabled ?? false,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!tenantId) {
      toast.error('Tenant não identificado');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('chatbot_settings')
        .upsert({
          tenant_id: tenantId,
          suggestions_enabled: settings.suggestions_enabled,
          suggestions_tone: settings.suggestions_tone,
          suggestions_count: settings.suggestions_count,
          auto_improve_enabled: settings.auto_improve_enabled,
          auto_summary_enabled: settings.auto_summary_enabled,
          auto_translate_enabled: settings.auto_translate_enabled,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'tenant_id' });

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com explicação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Assistente de Mensagens com IA
          </CardTitle>
          <CardDescription>
            Configure como a IA ajuda os agentes durante o atendimento, oferecendo sugestões 
            inteligentes para melhorar a qualidade e agilidade das respostas.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configurações de Sugestões */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurações de Sugestões</CardTitle>
          <CardDescription>
            Personalize como a IA gera sugestões de resposta para os agentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle Sugestões */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="suggestions_enabled" className="text-base">Ativar Sugestões IA</Label>
              <p className="text-sm text-muted-foreground">
                Permite que agentes recebam sugestões de resposta da IA
              </p>
            </div>
            <Switch
              id="suggestions_enabled"
              checked={settings.suggestions_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, suggestions_enabled: checked }))}
            />
          </div>

          {/* Tom das Respostas */}
          <div className="space-y-2">
            <Label htmlFor="suggestions_tone">Tom das Respostas</Label>
            <Select
              value={settings.suggestions_tone}
              onValueChange={(value) => setSettings(prev => ({ ...prev, suggestions_tone: value }))}
            >
              <SelectTrigger id="suggestions_tone" className="w-full md:w-[250px]">
                <SelectValue placeholder="Selecione o tom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="technical">Técnico</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Define o estilo de comunicação das sugestões geradas
            </p>
          </div>

          {/* Número de Sugestões */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Número de Sugestões</Label>
              <Badge variant="secondary">{settings.suggestions_count}</Badge>
            </div>
            <Slider
              value={[settings.suggestions_count]}
              onValueChange={([value]) => setSettings(prev => ({ ...prev, suggestions_count: value }))}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Quantas sugestões de resposta serão geradas por vez (1-5)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades Automáticas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funcionalidades Automáticas</CardTitle>
          <CardDescription>
            Recursos extras que a IA pode oferecer durante o atendimento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Melhorar Texto */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto_improve" className="text-base flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-purple-500" />
                Melhorar Texto
              </Label>
              <p className="text-sm text-muted-foreground">
                Reescreve mensagens para ficarem mais claras e profissionais
              </p>
            </div>
            <Switch
              id="auto_improve"
              checked={settings.auto_improve_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_improve_enabled: checked }))}
            />
          </div>

          {/* Resumir Conversa */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto_summary" className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                Resumir Conversa
              </Label>
              <p className="text-sm text-muted-foreground">
                Gera resumos de conversas longas para facilitar transferências
              </p>
            </div>
            <Switch
              id="auto_summary"
              checked={settings.auto_summary_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_summary_enabled: checked }))}
            />
          </div>

          {/* Tradução Automática */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto_translate" className="text-base flex items-center gap-2">
                <Languages className="h-4 w-4 text-orange-500" />
                Tradução Automática
              </Label>
              <p className="text-sm text-muted-foreground">
                Traduz mensagens em outros idiomas automaticamente
              </p>
            </div>
            <Switch
              id="auto_translate"
              checked={settings.auto_translate_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_translate_enabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </div>

      {/* Como Funciona */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como Usar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Sugestões de Resposta</p>
                <p className="text-sm text-muted-foreground">
                  No ticket, clique em "Sugestões IA" para receber respostas prontas
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Wand2 className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium">Melhorar Texto</p>
                <p className="text-sm text-muted-foreground">
                  Selecione uma mensagem e clique em "Melhorar" para reescrevê-la
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provedor de IA */}
      <Card>
        <CardHeader>
          <CardTitle>Provedor de IA</CardTitle>
          <CardDescription>
            O assistente usa o mesmo provedor configurado para o chatbot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Para alterar o provedor de IA ou configurar API Keys, acesse a aba "Provedores de IA".
            </p>
            <Button variant="outline" onClick={onNavigateToProviders}>
              <span className="flex items-center gap-2">
                Configurar Provedores
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dica Base de Conhecimento */}
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 Dica: Treine sua IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Para sugestões mais precisas, adicione informações na <strong>Base de Conhecimento</strong> — 
            FAQs, políticas e exemplos de boas respostas ajudam a IA a entender seu negócio.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
