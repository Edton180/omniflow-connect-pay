import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, BarChart, Check } from "lucide-react";
import * as LucideIcons from "lucide-react";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    if (!loading && user) {
      if (!profile) {
        navigate('/setup');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error fetching landing page settings:', error);
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || MessageSquare;
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  const Feature1Icon = getIcon(settings.feature_1_icon);
  const Feature2Icon = getIcon(settings.feature_2_icon);
  const Feature3Icon = getIcon(settings.feature_3_icon);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 opacity-50" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NCA4LjA2LTE4IDE4LTE4czE4IDguMDYgMTggMTgtOC4wNiAxOC0xOCAxOC0xOC04LjA2LTE4LTE4eiIvPjwvZz48L2c+PC9zdmc+')] opacity-10" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-5xl mx-auto text-center">
            {settings.logo_url && (
              <div className="mb-8 animate-fade-in">
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="h-20 w-auto mx-auto drop-shadow-2xl"
                />
              </div>
            )}
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
              {settings.hero_title}
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 animate-fade-in max-w-3xl mx-auto leading-relaxed">
              {settings.hero_subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <Button
                size="lg"
                className="text-lg px-10 py-7 hover-scale shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-primary to-secondary"
                onClick={() => navigate('/auth')}
              >
                {settings.hero_cta_text}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-7 hover-scale"
                onClick={() => {
                  const featuresSection = document.getElementById('features');
                  featuresSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Saiba Mais
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 text-sm px-4 py-2">Recursos</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Plataforma completa para gerenciar seu atendimento multicanal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="gradient-card hover-scale border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${settings.primary_color}20, ${settings.primary_color}10)`
                  }}
                >
                  <Feature1Icon 
                    className="w-8 h-8"
                    style={{ color: settings.primary_color }}
                  />
                </div>
                <CardTitle className="text-2xl mb-3">{settings.feature_1_title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base leading-relaxed">
                  {settings.feature_1_description}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="gradient-card hover-scale border-2 hover:border-secondary/50 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${settings.secondary_color}20, ${settings.secondary_color}10)`
                  }}
                >
                  <Feature2Icon 
                    className="w-8 h-8"
                    style={{ color: settings.secondary_color }}
                  />
                </div>
                <CardTitle className="text-2xl mb-3">{settings.feature_2_title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base leading-relaxed">
                  {settings.feature_2_description}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="gradient-card hover-scale border-2 hover:border-accent/50 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${settings.primary_color}20, ${settings.primary_color}10)`
                  }}
                >
                  <Feature3Icon 
                    className="w-8 h-8"
                    style={{ color: settings.primary_color }}
                  />
                </div>
                <CardTitle className="text-2xl mb-3">{settings.feature_3_title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base leading-relaxed">
                  {settings.feature_3_description}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
        <div className="container mx-auto px-4 relative">
          <Card className="max-w-4xl mx-auto gradient-card border-2 border-primary/20 p-8 md:p-12">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para transformar seu atendimento?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Junte-se a empresas que já otimizaram seu atendimento com nossa plataforma
              </p>
              <Button
                size="lg"
                className="text-lg px-10 py-7 hover-scale bg-gradient-to-r from-primary to-secondary"
                onClick={() => navigate('/auth')}
              >
                Começar Agora Gratuitamente
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            {settings.logo_url && (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="h-12 w-auto mx-auto mb-6 opacity-80"
              />
            )}
            <p className="text-muted-foreground mb-4">
              {settings.footer_text}
            </p>
            <div className="flex gap-6 justify-center text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a>
              <span>•</span>
              <a href="#" className="hover:text-primary transition-colors">Contato</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
