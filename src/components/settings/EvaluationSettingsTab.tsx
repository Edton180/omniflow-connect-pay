import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Star } from "lucide-react";

interface EvaluationSettingsTabProps {
  tenantId: string;
}

export function EvaluationSettingsTab({ tenantId }: EvaluationSettingsTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    rating_scale: 5,
    message_template: 'Como você avalia nosso atendimento?',
    thank_you_message: 'Obrigado pela sua avaliação!',
    auto_send_on_close: true,
  });

  useEffect(() => {
    loadSettings();
  }, [tenantId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("evaluation_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          enabled: data.enabled,
          rating_scale: data.rating_scale,
          message_template: data.message_template,
          thank_you_message: data.thank_you_message,
          auto_send_on_close: data.auto_send_on_close,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from("evaluation_settings")
        .select("id")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("evaluation_settings")
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq("tenant_id", tenantId);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("evaluation_settings")
          .insert({
            tenant_id: tenantId,
            ...settings,
          });

        if (error) throw error;
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações de avaliação foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Configurações de Avaliação
          </CardTitle>
          <CardDescription>
            Configure como as avaliações serão solicitadas aos clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sistema de Avaliação Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar ou desabilitar solicitações de avaliação
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enviar Automaticamente ao Fechar</Label>
              <p className="text-sm text-muted-foreground">
                Solicitar avaliação automaticamente quando o ticket for fechado
              </p>
            </div>
            <Switch
              checked={settings.auto_send_on_close}
              onCheckedChange={(checked) => setSettings({ ...settings, auto_send_on_close: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating_scale">Escala de Avaliação</Label>
            <Select
              value={settings.rating_scale.toString()}
              onValueChange={(value) => setSettings({ ...settings, rating_scale: parseInt(value) })}
            >
              <SelectTrigger id="rating_scale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 níveis (Ruim, Bom, Ótimo)</SelectItem>
                <SelectItem value="5">5 estrelas</SelectItem>
                <SelectItem value="10">Escala 0-10 (NPS)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Defina quantos níveis de avaliação serão oferecidos
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message_template">Mensagem de Solicitação</Label>
            <Textarea
              id="message_template"
              value={settings.message_template}
              onChange={(e) => setSettings({ ...settings, message_template: e.target.value })}
              placeholder="Como você avalia nosso atendimento?"
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Mensagem que será enviada ao cliente solicitando avaliação
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thank_you_message">Mensagem de Agradecimento</Label>
            <Textarea
              id="thank_you_message"
              value={settings.thank_you_message}
              onChange={(e) => setSettings({ ...settings, thank_you_message: e.target.value })}
              placeholder="Obrigado pela sua avaliação!"
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Mensagem enviada após o cliente avaliar o atendimento
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
