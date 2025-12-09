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
    // Hero
    hero_title: "OmniFlow - Plataforma de Atendimento Multicanal",
    hero_subtitle: "Gerencie todos os seus canais de atendimento em um só lugar",
    hero_cta_text: "Começar Agora",
    hero_image_url: "",
    logo_url: "",
    // Features
    feature_1_title: "Atendimento Multicanal",
    feature_1_description: "WhatsApp, Email, Telegram e mais",
    feature_1_icon: "MessageSquare",
    feature_2_title: "Gestão de Filas",
    feature_2_description: "Organize e distribua atendimentos",
    feature_2_icon: "Users",
    feature_3_title: "Relatórios Detalhados",
    feature_3_description: "Acompanhe métricas e performance",
    feature_3_icon: "BarChart",
    // Stats
    stats_1_value: "10K+",
    stats_1_label: "Empresas Ativas",
    stats_2_value: "99%",
    stats_2_label: "Satisfação",
    stats_3_value: "24/7",
    stats_3_label: "Suporte",
    // Benefits
    benefit_1_title: "Integração Rápida",
    benefit_1_description: "Configure em minutos e comece a atender",
    benefit_2_title: "Multi-Canais",
    benefit_2_description: "WhatsApp, Email, Telegram em um só lugar",
    benefit_3_title: "Relatórios em Tempo Real",
    benefit_3_description: "Dashboards completos e insights poderosos",
    benefit_4_title: "Segurança Total",
    benefit_4_description: "Criptografia e proteção de dados garantida",
    // Testimonials
    testimonial_1_text: "Excelente plataforma! Aumentou nossa produtividade em 300%.",
    testimonial_1_author: "João Silva",
    testimonial_1_role: "CEO, TechCorp",
    testimonial_1_avatar: "",
    testimonial_2_text: "O melhor sistema de atendimento que já usei. Recomendo!",
    testimonial_2_author: "Maria Santos",
    testimonial_2_role: "Gerente, StartupX",
    testimonial_2_avatar: "",
    testimonial_3_text: "Suporte incrível e interface intuitiva. Vale cada centavo.",
    testimonial_3_author: "Pedro Costa",
    testimonial_3_role: "CTO, FinTech",
    testimonial_3_avatar: "",
    // CTA
    cta_title: "Pronto para transformar seu atendimento?",
    cta_subtitle: "Junte-se a milhares de empresas que já revolucionaram seu suporte",
    cta_button_text: "Começar Gratuitamente",
    // Footer
    footer_company_description: "A plataforma mais completa para gerenciar atendimento multicanal.",
    footer_link_1_text: "Sobre",
    footer_link_1_url: "#",
    footer_link_2_text: "Recursos",
    footer_link_2_url: "#",
    footer_link_3_text: "Preços",
    footer_link_3_url: "#",
    footer_link_4_text: "Contato",
    footer_link_4_url: "#",
    footer_text: "© 2025 OmniFlow. Todos os direitos reservados.",
    // Colors
    primary_color: "#8B5CF6",
    secondary_color: "#3B82F6",
    accent_color: "#10B981",
    // Social Media
    social_twitter_url: "#",
    social_github_url: "#",
    social_linkedin_url: "#",
    // Support Links
    support_help_url: "#",
    support_docs_url: "#",
    support_status_url: "#",
    support_contact_url: "#",
    // Legal Links
    legal_terms_url: "#",
    legal_privacy_url: "#",
    legal_cookies_url: "#",
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
          stats_1_value: data.stats_1_value || "10K+",
          stats_1_label: data.stats_1_label || "Empresas Ativas",
          stats_2_value: data.stats_2_value || "99%",
          stats_2_label: data.stats_2_label || "Satisfação",
          stats_3_value: data.stats_3_value || "24/7",
          stats_3_label: data.stats_3_label || "Suporte",
          benefit_1_title: data.benefit_1_title || "Integração Rápida",
          benefit_1_description: data.benefit_1_description || "Configure em minutos",
          benefit_2_title: data.benefit_2_title || "Multi-Canais",
          benefit_2_description: data.benefit_2_description || "Todos em um só lugar",
          benefit_3_title: data.benefit_3_title || "Relatórios",
          benefit_3_description: data.benefit_3_description || "Insights poderosos",
          benefit_4_title: data.benefit_4_title || "Segurança",
          benefit_4_description: data.benefit_4_description || "Dados protegidos",
          testimonial_1_text: data.testimonial_1_text || "",
          testimonial_1_author: data.testimonial_1_author || "",
          testimonial_1_role: data.testimonial_1_role || "",
          testimonial_1_avatar: data.testimonial_1_avatar || "",
          testimonial_2_text: data.testimonial_2_text || "",
          testimonial_2_author: data.testimonial_2_author || "",
          testimonial_2_role: data.testimonial_2_role || "",
          testimonial_2_avatar: data.testimonial_2_avatar || "",
          testimonial_3_text: data.testimonial_3_text || "",
          testimonial_3_author: data.testimonial_3_author || "",
          testimonial_3_role: data.testimonial_3_role || "",
          testimonial_3_avatar: data.testimonial_3_avatar || "",
          cta_title: data.cta_title || "Pronto para começar?",
          cta_subtitle: data.cta_subtitle || "Junte-se a nós",
          cta_button_text: data.cta_button_text || "Começar Agora",
          footer_company_description: data.footer_company_description || "",
          footer_link_1_text: data.footer_link_1_text || "Sobre",
          footer_link_1_url: data.footer_link_1_url || "#",
          footer_link_2_text: data.footer_link_2_text || "Recursos",
          footer_link_2_url: data.footer_link_2_url || "#",
          footer_link_3_text: data.footer_link_3_text || "Preços",
          footer_link_3_url: data.footer_link_3_url || "#",
          footer_link_4_text: data.footer_link_4_text || "Contato",
          footer_link_4_url: data.footer_link_4_url || "#",
          footer_text: data.footer_text,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          accent_color: data.accent_color || "#10B981",
          // Social Media
          social_twitter_url: data.social_twitter_url || "#",
          social_github_url: data.social_github_url || "#",
          social_linkedin_url: data.social_linkedin_url || "#",
          // Support Links
          support_help_url: data.support_help_url || "#",
          support_docs_url: data.support_docs_url || "#",
          support_status_url: data.support_status_url || "#",
          support_contact_url: data.support_contact_url || "#",
          // Legal Links
          legal_terms_url: data.legal_terms_url || "#",
          legal_privacy_url: data.legal_privacy_url || "#",
          legal_cookies_url: data.legal_cookies_url || "#",
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
          <TabsList className="grid w-full grid-cols-9 h-auto flex-wrap">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="benefits">Benefícios</TabsTrigger>
            <TabsTrigger value="testimonials">Depoimentos</TabsTrigger>
            <TabsTrigger value="cta">CTA</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="style">Cores</TabsTrigger>
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

          <TabsContent value="stats" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label>Valor {num}</Label>
                      <Input
                        value={formData[`stats_${num}_value` as keyof typeof formData]}
                        onChange={(e) =>
                          setFormData({ ...formData, [`stats_${num}_value`]: e.target.value })
                        }
                        placeholder="10K+"
                      />
                    </div>
                    <div>
                      <Label>Descrição {num}</Label>
                      <Input
                        value={formData[`stats_${num}_label` as keyof typeof formData]}
                        onChange={(e) =>
                          setFormData({ ...formData, [`stats_${num}_label`]: e.target.value })
                        }
                        placeholder="Empresas Ativas"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits" className="space-y-6 mt-6">
            {[1, 2, 3, 4].map((num) => (
              <Card key={num}>
                <CardHeader>
                  <CardTitle>Benefício {num}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={formData[`benefit_${num}_title` as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData({ ...formData, [`benefit_${num}_title`]: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData[`benefit_${num}_description` as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData({ ...formData, [`benefit_${num}_description`]: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="testimonials" className="space-y-6 mt-6">
            {[1, 2, 3].map((num) => (
              <Card key={num}>
                <CardHeader>
                  <CardTitle>Depoimento {num}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Texto do Depoimento</Label>
                    <Textarea
                      value={formData[`testimonial_${num}_text` as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData({ ...formData, [`testimonial_${num}_text`]: e.target.value })
                      }
                      rows={3}
                      placeholder="O que o cliente disse..."
                    />
                  </div>
                  <div>
                    <Label>Nome do Autor</Label>
                    <Input
                      value={formData[`testimonial_${num}_author` as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData({ ...formData, [`testimonial_${num}_author`]: e.target.value })
                      }
                      placeholder="João Silva"
                    />
                  </div>
                  <div>
                    <Label>Cargo/Empresa</Label>
                    <Input
                      value={formData[`testimonial_${num}_role` as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData({ ...formData, [`testimonial_${num}_role`]: e.target.value })
                      }
                      placeholder="CEO, Empresa"
                    />
                  </div>
                  <div>
                    <Label>URL do Avatar</Label>
                    <Input
                      value={formData[`testimonial_${num}_avatar` as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData({ ...formData, [`testimonial_${num}_avatar`]: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="cta" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Call to Action Final</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título Principal</Label>
                  <Textarea
                    value={formData.cta_title}
                    onChange={(e) => setFormData({ ...formData, cta_title: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Subtítulo</Label>
                  <Textarea
                    value={formData.cta_subtitle}
                    onChange={(e) => setFormData({ ...formData, cta_subtitle: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Texto do Botão</Label>
                  <Input
                    value={formData.cta_button_text}
                    onChange={(e) => setFormData({ ...formData, cta_button_text: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="style" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Paleta de Cores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
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
                <div>
                  <Label>Cor de Destaque (Accent)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Rodapé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Descrição da Empresa</Label>
                  <Textarea
                    value={formData.footer_company_description}
                    onChange={(e) => setFormData({ ...formData, footer_company_description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="space-y-2">
                      <Label>Link {num}</Label>
                      <Input
                        value={formData[`footer_link_${num}_text` as keyof typeof formData]}
                        onChange={(e) =>
                          setFormData({ ...formData, [`footer_link_${num}_text`]: e.target.value })
                        }
                        placeholder="Texto do Link"
                      />
                      <Input
                        value={formData[`footer_link_${num}_url` as keyof typeof formData]}
                        onChange={(e) =>
                          setFormData({ ...formData, [`footer_link_${num}_url`]: e.target.value })
                        }
                        placeholder="URL"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <Label>Copyright</Label>
                  <Input
                    value={formData.footer_text}
                    onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Redes Sociais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Twitter/X URL</Label>
                  <Input
                    value={formData.social_twitter_url}
                    onChange={(e) => setFormData({ ...formData, social_twitter_url: e.target.value })}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div>
                  <Label>GitHub URL</Label>
                  <Input
                    value={formData.social_github_url}
                    onChange={(e) => setFormData({ ...formData, social_github_url: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={formData.social_linkedin_url}
                    onChange={(e) => setFormData({ ...formData, social_linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Links de Suporte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Central de Ajuda URL</Label>
                  <Input
                    value={formData.support_help_url}
                    onChange={(e) => setFormData({ ...formData, support_help_url: e.target.value })}
                    placeholder="https://help.seusite.com"
                  />
                </div>
                <div>
                  <Label>Documentação URL</Label>
                  <Input
                    value={formData.support_docs_url}
                    onChange={(e) => setFormData({ ...formData, support_docs_url: e.target.value })}
                    placeholder="https://docs.seusite.com"
                  />
                </div>
                <div>
                  <Label>Status do Sistema URL</Label>
                  <Input
                    value={formData.support_status_url}
                    onChange={(e) => setFormData({ ...formData, support_status_url: e.target.value })}
                    placeholder="https://status.seusite.com"
                  />
                </div>
                <div>
                  <Label>Contato URL</Label>
                  <Input
                    value={formData.support_contact_url}
                    onChange={(e) => setFormData({ ...formData, support_contact_url: e.target.value })}
                    placeholder="https://seusite.com/contato"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Links Legais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Termos de Uso URL</Label>
                  <Input
                    value={formData.legal_terms_url}
                    onChange={(e) => setFormData({ ...formData, legal_terms_url: e.target.value })}
                    placeholder="https://seusite.com/termos"
                  />
                </div>
                <div>
                  <Label>Política de Privacidade URL</Label>
                  <Input
                    value={formData.legal_privacy_url}
                    onChange={(e) => setFormData({ ...formData, legal_privacy_url: e.target.value })}
                    placeholder="https://seusite.com/privacidade"
                  />
                </div>
                <div>
                  <Label>Política de Cookies URL</Label>
                  <Input
                    value={formData.legal_cookies_url}
                    onChange={(e) => setFormData({ ...formData, legal_cookies_url: e.target.value })}
                    placeholder="https://seusite.com/cookies"
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
