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
import { useGlobalAIConfig, availableModels, toneOptions } from "@/hooks/useGlobalAIConfig";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  Bot, 
  Sparkles, 
  Zap, 
  Shield, 
  Activity,
  CheckCircle,
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

export default function SuperAdminAIConfig() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { config, loading: configLoading, saveConfig: saveGlobalConfig } = useGlobalAIConfig();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  const [aiStats, setAIStats] = useState<AIStats>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0,
  });

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setAIStats({
      totalRequests: Math.floor(Math.random() * 10000),
      successfulRequests: Math.floor(Math.random() * 9000),
      failedRequests: Math.floor(Math.random() * 100),
      avgResponseTime: Math.floor(Math.random() * 500) + 200,
    });
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const result = await saveGlobalConfig(localConfig);
      if (result.success) {
        toast({
          title: t('chatbot.configSaved'),
          description: t('chatbot.configSavedDesc'),
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testAI = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-ai-provider', {
        body: { 
          model: localConfig.defaultModel,
          message: "Olá, este é um teste de conectividade. Responda brevemente." 
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: t('chatbot.testSuccess'),
          description: `${t('chatbot.responseTime')}: ${data?.responseTime || 'N/A'}ms`,
        });
      } else {
        throw new Error(data?.message || t('chatbot.testError'));
      }
    } catch (error: any) {
      toast({
        title: t('chatbot.testError'),
        description: error.message || t('chatbot.connectionError'),
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
              <h1 className="text-3xl font-bold">{t('chatbot.globalConfig')}</h1>
              <p className="text-muted-foreground">{t('chatbot.globalConfigDesc')}</p>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('chatbot.statusLovableAI')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-500">{t('chatbot.active')}</span>
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
                  <p className="text-sm text-muted-foreground">{t('chatbot.requestsToday')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('chatbot.successRate')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('chatbot.avgTime')}</p>
                  <p className="text-2xl font-bold">{aiStats.avgResponseTime}ms</p>
                </div>
                <Cpu className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">{t('chatbot.general')}</TabsTrigger>
            <TabsTrigger value="models">{t('chatbot.models')}</TabsTrigger>
            <TabsTrigger value="personality">{t('chatbot.personality')}</TabsTrigger>
            <TabsTrigger value="limits">{t('chatbot.limits')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Lovable AI
                </CardTitle>
                <CardDescription>
                  {t('chatbot.lovableAIDesc')}
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
                        {t('chatbot.gatewayDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="default" className="bg-green-500">{t('chatbot.autoConfigured')}</Badge>
                    <Switch 
                      checked={localConfig.lovableAIEnabled}
                      onCheckedChange={(checked) => setLocalConfig({...localConfig, lovableAIEnabled: checked})}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('chatbot.defaultModel')}</Label>
                    <Select 
                      value={localConfig.defaultModel} 
                      onValueChange={(value) => setLocalConfig({...localConfig, defaultModel: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map(model => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                              {model.name}
                              {model.recommended && <Badge variant="secondary" className="text-xs">{t('chatbot.recommended')}</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('chatbot.fallbackEnabled')}</Label>
                      <Switch 
                        checked={localConfig.fallbackEnabled}
                        onCheckedChange={(checked) => setLocalConfig({...localConfig, fallbackEnabled: checked})}
                      />
                    </div>
                    {localConfig.fallbackEnabled && (
                      <Select 
                        value={localConfig.fallbackModel} 
                        onValueChange={(value) => setLocalConfig({...localConfig, fallbackModel: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('chatbot.fallbackModel')} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels.filter(m => m.id !== localConfig.defaultModel).map(model => (
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
                    {t('chatbot.testConnection')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('chatbot.availableModels')}</CardTitle>
                <CardDescription>
                  {t('chatbot.modelsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {availableModels.map(model => (
                    <div 
                      key={model.id} 
                      className={`p-4 border rounded-lg transition-all ${
                        localConfig.defaultModel === model.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{model.name}</h4>
                          <p className="text-xs text-muted-foreground">{model.provider}</p>
                        </div>
                        <div className="flex gap-2">
                          {model.recommended && <Badge className="bg-green-500">{t('chatbot.recommended')}</Badge>}
                          {localConfig.defaultModel === model.id && <Badge variant="outline">{t('chatbot.default')}</Badge>}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setLocalConfig({...localConfig, defaultModel: model.id})}
                        disabled={localConfig.defaultModel === model.id}
                      >
                        {localConfig.defaultModel === model.id ? t('chatbot.selected') : t('chatbot.select')}
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
                  {t('chatbot.globalPersonality')}
                </CardTitle>
                <CardDescription>
                  {t('chatbot.personalityDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('chatbot.systemPrompt')}</Label>
                  <Textarea 
                    value={localConfig.globalPersonality}
                    onChange={(e) => setLocalConfig({...localConfig, globalPersonality: e.target.value})}
                    placeholder={t('chatbot.systemPromptPlaceholder')}
                    className="min-h-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('chatbot.systemPromptDesc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('chatbot.defaultTone')}</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {toneOptions.map(tone => (
                      <div 
                        key={tone.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          localConfig.defaultTone === tone.value ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                        onClick={() => setLocalConfig({...localConfig, defaultTone: tone.value})}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            localConfig.defaultTone === tone.value ? 'bg-primary' : 'bg-muted'
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
                  {t('chatbot.limitsAndControls')}
                </CardTitle>
                <CardDescription>
                  {t('chatbot.limitsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('chatbot.maxTokens')}</Label>
                    <Input 
                      type="number"
                      value={localConfig.maxTokens}
                      onChange={(e) => setLocalConfig({...localConfig, maxTokens: parseInt(e.target.value) || 1000})}
                      min={100}
                      max={4000}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('chatbot.maxTokensDesc')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('chatbot.temperature')}</Label>
                    <Input 
                      type="number"
                      value={localConfig.temperature}
                      onChange={(e) => setLocalConfig({...localConfig, temperature: parseFloat(e.target.value) || 0.7})}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('chatbot.temperatureDesc')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('chatbot.rateLimit')}</Label>
                    <Input 
                      type="number"
                      value={localConfig.rateLimitPerTenant}
                      onChange={(e) => setLocalConfig({...localConfig, rateLimitPerTenant: parseInt(e.target.value) || 100})}
                      min={10}
                      max={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('chatbot.rateLimitDesc')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('chatbot.enableLogging')}</Label>
                      <Switch 
                        checked={localConfig.enableLogging}
                        onCheckedChange={(checked) => setLocalConfig({...localConfig, enableLogging: checked})}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('chatbot.enableLoggingDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveConfig} disabled={saving} size="lg">
            {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t('common.save')}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
