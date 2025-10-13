import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LogOut, Save, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPageEditor() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hero_title: "OmniFlow - Plataforma de Atendimento Multicanal",
    hero_subtitle: "Gerencie todos os seus canais de atendimento em um só lugar",
    hero_cta_text: "Começar Agora",
    hero_image_url: "",
    logo_url: "",
    feature_1_title: "Atendimento Multicanal",
    feature_1_description: "WhatsApp, Email, Telegram e mais",
    feature_1_icon: "MessageSquare",
    feature_2_title: "Gestão de Filas",
    feature_2_description: "Organize e distribua atendimentos",
    feature_2_icon: "Users",
    feature_3_title: "Relatórios Detalhados",
    feature_3_description: "Acompanhe métricas e performance",
    feature_3_icon: "BarChart",
    pricing_title: "Planos e Preços",
    pricing_subtitle: "Escolha o melhor plano para seu negócio",
    footer_text: "© 2025 OmniFlow. Todos os direitos reservados.",
    primary_color: "#8B5CF6",
    secondary_color: "#3B82F6",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("landing_page_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          hero_title: data.hero_title,
          hero_subtitle: data.hero_subtitle,
          hero_cta_text: data.hero_cta_text,
          hero_image_url: data.hero_image_url || "",
          logo_url: data.logo_url || "",
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
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("landing_page_settings")
        .select("id")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("landing_page_settings")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("landing_page_settings")
          .insert({
            ...formData,
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Landing page atualizada com sucesso!",
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Editor Landing Page Principal</h1>
              <p className="text-xs text-foreground/60">Personalize a página inicial do sistema</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => window.open("/", "_blank")}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </Button>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="hero" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="pricing">Preços</TabsTrigger>
            <TabsTrigger value="style">Estilo</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Seção Hero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título Principal</Label>
                  <Input
                    value={formData.hero_title}
                    onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Subtítulo</Label>
                  <Textarea
                    value={formData.hero_subtitle}
                    onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Texto do Botão</Label>
                  <Input
                    value={formData.hero_cta_text}
                    onChange={(e) => setFormData({ ...formData, hero_cta_text: e.target.value })}
                  />
                </div>
                <div>
                  <Label>URL da Imagem Hero</Label>
                  <Input
                    value={formData.hero_image_url}
                    onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>URL do Logo</Label>
                  <Input
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6 mt-6">
            {[1, 2, 3].map((num) => (
              <Card key={num}>
                <CardHeader>
                  <CardTitle>Feature {num}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={formData[`feature_${num}_title` as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData({ ...formData, [`feature_${num}_title`]: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={formData[`feature_${num}_description` as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData({ ...formData, [`feature_${num}_description`]: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Ícone (Lucide Icon Name)</Label>
                    <Input
                      value={formData[`feature_${num}_icon` as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData({ ...formData, [`feature_${num}_icon`]: e.target.value })
                      }
                      placeholder="MessageSquare"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Seção de Preços</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={formData.pricing_title}
                    onChange={(e) => setFormData({ ...formData, pricing_title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Subtítulo</Label>
                  <Input
                    value={formData.pricing_subtitle}
                    onChange={(e) => setFormData({ ...formData, pricing_subtitle: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="style" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Cores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Rodapé</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Texto do Rodapé</Label>
                  <Input
                    value={formData.footer_text}
                    onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
