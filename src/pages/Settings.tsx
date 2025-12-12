import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Edit, Copy, Bot, Sparkles, ExternalLink, Info, Zap, Globe, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentSecretsTab } from '@/components/settings/PaymentSecretsTab';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/hooks/useLanguage';
import { languages } from '@/i18n/languages';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

export default function Settings() {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const [loading, setLoading] = useState(false);
  const isSuperAdmin = roles.some(r => r.role === 'super_admin');
  const [settings, setSettings] = useState({
    siteName: 'OmniFlow',
    siteDescription: 'Plataforma de atendimento multi-tenant',
    maintenanceMode: false,
    allowSignups: true,
    requireEmailVerification: false,
    maxTenantsPerPlan: 100,
    sessionTimeout: 30,
    webhookUrl: '',
    customDomain: '',
    serverIp: '',
  });
  
  const [languageSettings, setLanguageSettings] = useState({
    defaultLanguage: 'pt-BR',
    autoDetect: true,
    availableLanguages: languages.map(l => l.code),
  });

  useEffect(() => {
    if (isSuperAdmin) {
      loadSettings();
      loadLanguageSettings();
    }
  }, [isSuperAdmin]);

  const loadSettings = async () => {
    try {
      const webhookUrl = `${window.location.origin}/api/webhooks`;
      
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const serverIp = data.ip;
      
      setSettings(prev => ({ 
        ...prev, 
        webhookUrl,
        serverIp 
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadLanguageSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['default_language', 'auto_detect_language', 'available_languages']);

      if (error) throw error;

      if (data) {
        const settingsMap: Record<string, any> = {};
        data.forEach(item => {
          settingsMap[item.key] = item.value;
        });

        setLanguageSettings({
          defaultLanguage: settingsMap['default_language'] || 'pt-BR',
          autoDetect: settingsMap['auto_detect_language'] ?? true,
          availableLanguages: settingsMap['available_languages'] || languages.map(l => l.code),
        });
      }
    } catch (error) {
      console.error('Error loading language settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      localStorage.setItem('omniflow_settings', JSON.stringify(settings));
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error(t('settings.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLanguageSettings = async () => {
    setLoading(true);
    try {
      const updates = [
        { key: 'default_language', value: languageSettings.defaultLanguage },
        { key: 'auto_detect_language', value: languageSettings.autoDetect },
        { key: 'available_languages', value: languageSettings.availableLanguages },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: update.value })
          .eq('key', update.key);

        if (error) throw error;
      }

      toast.success(t('settings.saved'));
    } catch (error) {
      console.error('Error saving language settings:', error);
      toast.error(t('settings.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('common.copied'));
  };

  const toggleLanguageAvailability = (langCode: string) => {
    setLanguageSettings(prev => {
      const isAvailable = prev.availableLanguages.includes(langCode);
      if (isAvailable) {
        // Don't allow removing the last language or default language
        if (prev.availableLanguages.length === 1 || langCode === prev.defaultLanguage) {
          return prev;
        }
        return {
          ...prev,
          availableLanguages: prev.availableLanguages.filter(l => l !== langCode),
        };
      } else {
        return {
          ...prev,
          availableLanguages: [...prev.availableLanguages, langCode],
        };
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('settings.backToDashboard')}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('settings.title')}</h1>
          <p className="text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
            <TabsTrigger value="auth">{t('settings.authentication')}</TabsTrigger>
            <TabsTrigger value="language">
              <Globe className="h-4 w-4 mr-2" />
              {t('settings.language')}
            </TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="integrations">{t('settings.integrations')}</TabsTrigger>}
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {isSuperAdmin && (
              <>
                {/* Card explicativo sobre IA */}
                <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      Inteligência Artificial (Lovable AI)
                    </CardTitle>
                    <CardDescription>
                      Seu sistema já vem com IA pré-configurada e pronta para uso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <Sparkles className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Lovable AI Gateway está ativo e funcionando
                      </span>
                      <Badge className="ml-auto bg-green-500">Conectado</Badge>
                    </div>
                    
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Como funciona:</strong> O Lovable AI é um gateway que dá acesso aos 
                        modelos Google Gemini e OpenAI GPT sem necessidade de configurar chaves de API. 
                        A chave <code className="px-1 py-0.5 rounded bg-muted">LOVABLE_API_KEY</code> já 
                        está pré-configurada automaticamente.
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-4 w-4 text-purple-500" />
                          <span className="font-medium text-sm">Modelos Disponíveis</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Gemini 2.5 Flash, Gemini Pro, GPT-5, GPT-5 Mini e mais
                        </p>
                      </div>
                      <div className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="h-4 w-4 text-pink-500" />
                          <span className="font-medium text-sm">Uso Incluído</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Créditos mensais gratuitos incluídos no plano
                        </p>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/admin/ai-config')}
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      Configurar IA Global
                      <ExternalLink className="ml-auto h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Webhook URL</CardTitle>
                    <CardDescription>URL para receber notificações de eventos do sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={settings.webhookUrl}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(settings.webhookUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use esta URL para configurar webhooks nos gateways de pagamento e canais de comunicação
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>IP do Servidor</CardTitle>
                    <CardDescription>IP público para apontamento de domínio</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={settings.serverIp || 'Carregando...'}
                        readOnly
                        className="flex-1 font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(settings.serverIp)}
                        disabled={!settings.serverIp}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aponte seu domínio para este IP usando um registro A
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Domínio Customizado</CardTitle>
                    <CardDescription>Configure o domínio do seu SaaS</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customDomain">Domínio</Label>
                      <Input
                        id="customDomain"
                        value={settings.customDomain}
                        onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
                        placeholder="seu-dominio.com.br"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Após configurar, aponte seu domínio para o IP do servidor
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Landing Page</CardTitle>
                    <CardDescription>Edite a página inicial customizável do sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/landing-page-editor')}
                      className="w-full"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Landing Page
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{t('settings.generalInfo')}</CardTitle>
                <CardDescription>{t('settings.generalInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">{t('settings.siteName')}</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) =>
                      setSettings({ ...settings, siteName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">{t('settings.siteDescription')}</Label>
                  <Input
                    id="siteDescription"
                    value={settings.siteDescription}
                    onChange={(e) =>
                      setSettings({ ...settings, siteDescription: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('settings.system')}</CardTitle>
                <CardDescription>{t('settings.systemDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.maintenanceMode')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.maintenanceModeDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, maintenanceMode: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTenants">{t('settings.maxTenants')}</Label>
                  <Input
                    id="maxTenants"
                    type="number"
                    value={settings.maxTenantsPerPlan}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maxTenantsPerPlan: parseInt(e.target.value) || 100,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {isSuperAdmin && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">{t('settings.dangerZone')}</CardTitle>
                  <CardDescription>{t('settings.dangerZoneDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('settings.systemReset')}</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('settings.systemResetDesc')}
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => navigate('/system-reset')}
                      className="w-full"
                    >
                      🔧 {t('settings.systemReset')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </TabsContent>

          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.authentication')}</CardTitle>
                <CardDescription>Configurações de acesso e segurança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.allowSignups')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.allowSignupsDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowSignups}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, allowSignups: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.emailVerification')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.emailVerificationDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, requireEmailVerification: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">{t('settings.sessionTimeout')}</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sessionTimeout: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </TabsContent>

          <TabsContent value="language" className="space-y-6">
            {/* Current User Language */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t('settings.language')}
                </CardTitle>
                <CardDescription>
                  Seu idioma atual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Idioma do Sistema</Label>
                  <Select
                    value={language.code}
                    onValueChange={(value) => {
                      const lang = availableLanguages.find(l => l.code === value);
                      if (lang) setLanguage(lang);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flagEmoji}</span>
                            <span>{lang.nativeName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Escolha o idioma que deseja usar na interface
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Super Admin Language Settings */}
            {isSuperAdmin && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.languageSettings')}</CardTitle>
                    <CardDescription>{t('settings.languageSubtitle')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>{t('settings.defaultLanguage')}</Label>
                      <Select
                        value={languageSettings.defaultLanguage}
                        onValueChange={(value) => 
                          setLanguageSettings({ ...languageSettings, defaultLanguage: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.filter(l => languageSettings.availableLanguages.includes(l.code)).map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              <div className="flex items-center gap-2">
                                <span>{lang.flagEmoji}</span>
                                <span>{lang.nativeName}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t('settings.defaultLanguageDesc')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{t('settings.autoDetect')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.autoDetectDesc')}
                        </p>
                      </div>
                      <Switch
                        checked={languageSettings.autoDetect}
                        onCheckedChange={(checked) =>
                          setLanguageSettings({ ...languageSettings, autoDetect: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('settings.availableLanguages')}</CardTitle>
                    <CardDescription>{t('settings.availableLanguagesDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="grid gap-2">
                        {languages.map((lang) => {
                          const isAvailable = languageSettings.availableLanguages.includes(lang.code);
                          const isDefault = languageSettings.defaultLanguage === lang.code;
                          return (
                            <div
                              key={lang.code}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                isAvailable ? 'bg-primary/5 border-primary/30' : 'bg-muted/50'
                              }`}
                            >
                              <Checkbox
                                id={lang.code}
                                checked={isAvailable}
                                onCheckedChange={() => toggleLanguageAvailability(lang.code)}
                                disabled={isDefault}
                              />
                              <span className="text-2xl">{lang.flagEmoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{lang.nativeName}</p>
                                <p className="text-xs text-muted-foreground">{lang.name}</p>
                              </div>
                              {isDefault && (
                                <Badge variant="secondary">Padrão</Badge>
                              )}
                              {isAvailable && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Button onClick={handleSaveLanguageSettings} disabled={loading} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? t('common.loading') : t('common.save')}
                </Button>
              </>
            )}
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="integrations">
              <PaymentSecretsTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}