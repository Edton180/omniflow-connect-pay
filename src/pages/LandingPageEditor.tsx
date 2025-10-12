import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Save, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LandingPageEditor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_cta_text: '',
    hero_image_url: '',
    feature_1_title: '',
    feature_1_description: '',
    feature_1_icon: 'MessageSquare',
    feature_2_title: '',
    feature_2_description: '',
    feature_2_icon: 'Users',
    feature_3_title: '',
    feature_3_description: '',
    feature_3_icon: 'BarChart',
    pricing_title: '',
    pricing_subtitle: '',
    footer_text: '',
    primary_color: '#8B5CF6',
    secondary_color: '#3B82F6',
    logo_url: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('landing_page_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setFormData({
          hero_title: data.hero_title,
          hero_subtitle: data.hero_subtitle,
          hero_cta_text: data.hero_cta_text,
          hero_image_url: data.hero_image_url || '',
          feature_1_title: data.feature_1_title,
          feature_1_description: data.feature_1_description,
          feature_1_icon: data.feature_1_icon,
          feature_2_title: data.feature_2_title,
          feature_2_description: data.feature_2_description,
          feature_2_icon: data.feature_2_icon,
          feature_3_title: data.feature_3_title,
          feature_3_description: data.feature_3_description,
          feature_3_icon: data.feature_3_icon,
          pricing_title: data.pricing_title,
          pricing_subtitle: data.pricing_subtitle,
          footer_text: data.footer_text,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          logo_url: data.logo_url || '',
        });
      }
    } catch (error: any) {
      toast.error('Erro ao carregar configurações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('landing_page_settings')
        .update(formData)
        .eq('id', settings.id);

      if (error) throw error;

      toast.success('Landing page atualizada com sucesso!');
      fetchSettings();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open('/', '_blank')}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Editor de Landing Page</h1>
          <p className="text-muted-foreground">
            Personalize todos os elementos da página inicial
          </p>
        </div>

        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="features">Recursos</TabsTrigger>
            <TabsTrigger value="pricing">Preços</TabsTrigger>
            <TabsTrigger value="footer">Rodapé</TabsTrigger>
            <TabsTrigger value="branding">Marca</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="hero" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Seção Hero</CardTitle>
                  <CardDescription>Primeira seção da página</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hero_title">Título Principal</Label>
                    <Input
                      id="hero_title"
                      value={formData.hero_title}
                      onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hero_subtitle">Subtítulo</Label>
                    <Textarea
                      id="hero_subtitle"
                      value={formData.hero_subtitle}
                      onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hero_cta_text">Texto do Botão</Label>
                    <Input
                      id="hero_cta_text"
                      value={formData.hero_cta_text}
                      onChange={(e) => setFormData({ ...formData, hero_cta_text: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hero_image_url">URL da Imagem (opcional)</Label>
                    <Input
                      id="hero_image_url"
                      value={formData.hero_image_url}
                      onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recursos</CardTitle>
                  <CardDescription>Destaque os principais recursos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="border-b pb-6 last:border-0">
                      <h3 className="font-semibold mb-4">Recurso {num}</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`feature_${num}_title`}>Título</Label>
                          <Input
                            id={`feature_${num}_title`}
                            value={formData[`feature_${num}_title` as keyof typeof formData]}
                            onChange={(e) =>
                              setFormData({ ...formData, [`feature_${num}_title`]: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`feature_${num}_description`}>Descrição</Label>
                          <Textarea
                            id={`feature_${num}_description`}
                            value={formData[`feature_${num}_description` as keyof typeof formData]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [`feature_${num}_description`]: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`feature_${num}_icon`}>Ícone (Lucide)</Label>
                          <Input
                            id={`feature_${num}_icon`}
                            value={formData[`feature_${num}_icon` as keyof typeof formData]}
                            onChange={(e) =>
                              setFormData({ ...formData, [`feature_${num}_icon`]: e.target.value })
                            }
                            placeholder="MessageSquare"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Seção de Preços</CardTitle>
                  <CardDescription>Títulos da seção de planos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricing_title">Título</Label>
                    <Input
                      id="pricing_title"
                      value={formData.pricing_title}
                      onChange={(e) => setFormData({ ...formData, pricing_title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricing_subtitle">Subtítulo</Label>
                    <Textarea
                      id="pricing_subtitle"
                      value={formData.pricing_subtitle}
                      onChange={(e) =>
                        setFormData({ ...formData, pricing_subtitle: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="footer" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rodapé</CardTitle>
                  <CardDescription>Informações do rodapé</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="footer_text">Texto do Rodapé</Label>
                    <Input
                      id="footer_text"
                      value={formData.footer_text}
                      onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Identidade Visual</CardTitle>
                  <CardDescription>Cores e logo da marca</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo_url">URL do Logo</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Cor Primária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          type="color"
                          value={formData.primary_color}
                          onChange={(e) =>
                            setFormData({ ...formData, primary_color: e.target.value })
                          }
                          className="w-20"
                        />
                        <Input
                          value={formData.primary_color}
                          onChange={(e) =>
                            setFormData({ ...formData, primary_color: e.target.value })
                          }
                          placeholder="#8B5CF6"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Cor Secundária</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary_color"
                          type="color"
                          value={formData.secondary_color}
                          onChange={(e) =>
                            setFormData({ ...formData, secondary_color: e.target.value })
                          }
                          className="w-20"
                        />
                        <Input
                          value={formData.secondary_color}
                          onChange={(e) =>
                            setFormData({ ...formData, secondary_color: e.target.value })
                          }
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Tabs>
      </div>
    </div>
  );
}
