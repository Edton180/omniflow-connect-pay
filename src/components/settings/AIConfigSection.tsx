import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface AIConfig {
  id?: string;
  provider: 'openai' | 'google' | 'xai';
  api_key_encrypted: string;
  is_active: boolean;
}

export function AIConfigSection() {
  const { roles } = useAuth();
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<Record<string, AIConfig>>({
    openai: { provider: 'openai', api_key_encrypted: '', is_active: false },
    google: { provider: 'google', api_key_encrypted: '', is_active: false },
    xai: { provider: 'xai', api_key_encrypted: '', is_active: false },
  });

  useEffect(() => {
    loadConfigs();
  }, [roles]);

  const loadConfigs = async () => {
    const tenantRole = roles?.find((r) => r.tenant_id);
    if (!tenantRole?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('ai_configs')
        .select('*')
        .eq('tenant_id', tenantRole.tenant_id);

      if (error) throw error;

      if (data) {
        const configMap: Record<string, AIConfig> = { ...configs };
        data.forEach((config) => {
          configMap[config.provider] = config as AIConfig;
        });
        setConfigs(configMap);
      }
    } catch (error: any) {
      console.error('Error loading AI configs:', error);
    }
  };

  const saveConfig = async (provider: 'openai' | 'google' | 'xai') => {
    const tenantRole = roles?.find((r) => r.tenant_id);
    if (!tenantRole?.tenant_id) {
      toast.error('Tenant não identificado');
      return;
    }

    const config = configs[provider];
    if (!config.api_key_encrypted.trim()) {
      toast.error('Por favor, insira a API Key');
      return;
    }

    setLoading(true);
    try {
      const configData = {
        tenant_id: tenantRole.tenant_id,
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
      await loadConfigs();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
              value={configs.openai.api_key_encrypted}
              onChange={(e) =>
                setConfigs({
                  ...configs,
                  openai: { ...configs.openai, api_key_encrypted: e.target.value },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="openai-active"
                checked={configs.openai.is_active}
                onCheckedChange={(checked) =>
                  setConfigs({ ...configs, openai: { ...configs.openai, is_active: checked } })
                }
              />
              <Label htmlFor="openai-active">Ativar OpenAI</Label>
            </div>
            <Button onClick={() => saveConfig('openai')} disabled={loading}>
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
              value={configs.google.api_key_encrypted}
              onChange={(e) =>
                setConfigs({
                  ...configs,
                  google: { ...configs.google, api_key_encrypted: e.target.value },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="google-active"
                checked={configs.google.is_active}
                onCheckedChange={(checked) =>
                  setConfigs({ ...configs, google: { ...configs.google, is_active: checked } })
                }
              />
              <Label htmlFor="google-active">Ativar Gemini</Label>
            </div>
            <Button onClick={() => saveConfig('google')} disabled={loading}>
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
              value={configs.xai.api_key_encrypted}
              onChange={(e) =>
                setConfigs({
                  ...configs,
                  xai: { ...configs.xai, api_key_encrypted: e.target.value },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="xai-active"
                checked={configs.xai.is_active}
                onCheckedChange={(checked) =>
                  setConfigs({ ...configs, xai: { ...configs.xai, is_active: checked } })
                }
              />
              <Label htmlFor="xai-active">Ativar Grok</Label>
            </div>
            <Button onClick={() => saveConfig('xai')} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}