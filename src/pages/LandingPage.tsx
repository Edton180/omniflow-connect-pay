import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ArrowRight, Star, Zap, Shield, TrendingUp, Quote, MessageSquare } from "lucide-react";
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

  // Aplicar favicon e meta tags dinamicamente
  useEffect(() => {
    if (settings?.favicon_url) {
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (link) link.href = settings.favicon_url;
    }
    if (settings?.meta_description) {
      const meta = document.querySelector("meta[name='description']") as HTMLMetaElement;
      if (meta) meta.content = settings.meta_description;
    }
    if (settings?.hero_title) {
      document.title = settings.hero_title;
    }
  }, [settings]);

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
  const Feature4Icon = getIcon(settings.feature_4_icon || 'Bot');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Modern Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/10">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-6xl mx-auto">
            {/* Logo */}
            {settings.logo_url && (
              <div className="flex justify-center mb-8 animate-fade-in">
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="h-16 w-auto"
                />
              </div>
            )}
            
            {/* Hero Content */}
            <div className="text-center space-y-8 animate-fade-in">
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-primary/20">
                <Zap className="w-3 h-3 mr-2 inline" />
                Plataforma Líder de Atendimento
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                  {settings.hero_title}
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {settings.hero_subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 rounded-full hover-scale shadow-xl hover:shadow-2xl transition-all duration-300 group"
                  onClick={() => navigate('/auth')}
                >
                  {settings.hero_cta_text}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 rounded-full hover-scale border-2"
                  onClick={() => {
                    const featuresSection = document.getElementById('features');
                    featuresSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Saiba Mais
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Setup em 5 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Suporte 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 fill-background" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* Stats Section - Modern Cards */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center p-8 hover-scale border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-3">
                {settings.stats_1_value}
              </div>
              <div className="text-lg text-muted-foreground font-medium">{settings.stats_1_label}</div>
            </Card>
            <Card className="text-center p-8 hover-scale border-2 hover:border-secondary/50 transition-all duration-300 bg-gradient-to-br from-secondary/5 to-transparent">
              <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-secondary to-accent mb-3">
                {settings.stats_2_value}
              </div>
              <div className="text-lg text-muted-foreground font-medium">{settings.stats_2_label}</div>
            </Card>
            <Card className="text-center p-8 hover-scale border-2 hover:border-accent/50 transition-all duration-300 bg-gradient-to-br from-accent/5 to-transparent">
              <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary mb-3">
                {settings.stats_3_value}
              </div>
              <div className="text-lg text-muted-foreground font-medium">{settings.stats_3_label}</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-4 text-sm px-4 py-2">Recursos</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Plataforma completa para gerenciar seu atendimento multicanal com eficiência
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <Card className="group p-8 hover-scale border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-card to-primary/5">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                style={{ 
                  background: `linear-gradient(135deg, ${settings.primary_color}30, ${settings.primary_color}10)`
                }}
              >
                <Feature1Icon 
                  className="w-7 h-7"
                  style={{ color: settings.primary_color }}
                />
              </div>
              <h3 className="text-2xl font-bold mb-3">{settings.feature_1_title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {settings.feature_1_description}
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="group p-8 hover-scale border-2 hover:border-secondary/50 transition-all duration-300 bg-gradient-to-br from-card to-secondary/5">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                style={{ 
                  background: `linear-gradient(135deg, ${settings.secondary_color}30, ${settings.secondary_color}10)`
                }}
              >
                <Feature2Icon 
                  className="w-7 h-7"
                  style={{ color: settings.secondary_color }}
                />
              </div>
              <h3 className="text-2xl font-bold mb-3">{settings.feature_2_title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {settings.feature_2_description}
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="group p-8 hover-scale border-2 hover:border-accent/50 transition-all duration-300 bg-gradient-to-br from-card to-accent/5">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                style={{ 
                  background: `linear-gradient(135deg, ${settings.primary_color}30, ${settings.primary_color}10)`
                }}
              >
                <Feature3Icon 
                  className="w-7 h-7"
                  style={{ color: settings.primary_color }}
                />
              </div>
              <h3 className="text-2xl font-bold mb-3">{settings.feature_3_title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {settings.feature_3_description}
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="group p-8 hover-scale border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-card to-primary/5">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                style={{ 
                  background: `linear-gradient(135deg, ${settings.secondary_color}30, ${settings.secondary_color}10)`
                }}
              >
                <Feature4Icon 
                  className="w-7 h-7"
                  style={{ color: settings.secondary_color }}
                />
              </div>
              <h3 className="text-2xl font-bold mb-3">{settings.feature_4_title || 'Automações Inteligentes'}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {settings.feature_4_description || 'Fluxos automatizados com IA para respostas rápidas'}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section - Editável */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-secondary/20">
                <Shield className="w-3 h-3 mr-2 inline" />
                Por que escolher
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold">
                Sua melhor escolha para
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-secondary to-accent">
                  atendimento de excelência
                </span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 hover-scale border-2 hover:border-primary/30 transition-all group">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{settings.benefit_1_title}</h3>
                    <p className="text-muted-foreground">{settings.benefit_1_description}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 hover-scale border-2 hover:border-secondary/30 transition-all group">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{settings.benefit_2_title}</h3>
                    <p className="text-muted-foreground">{settings.benefit_2_description}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 hover-scale border-2 hover:border-accent/30 transition-all group">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{settings.benefit_3_title}</h3>
                    <p className="text-muted-foreground">{settings.benefit_3_description}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 hover-scale border-2 hover:border-primary/30 transition-all group">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{settings.benefit_4_title}</h3>
                    <p className="text-muted-foreground">{settings.benefit_4_description}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-accent/20">
                <Quote className="w-3 h-3 mr-2 inline" />
                Depoimentos
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold">
                O que nossos clientes
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">
                  dizem sobre nós
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <Card className="p-8 hover-scale border-2 hover:border-primary/30 transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{settings.testimonial_1_text}"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={settings.testimonial_1_avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {settings.testimonial_1_author?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{settings.testimonial_1_author}</div>
                    <div className="text-sm text-muted-foreground">{settings.testimonial_1_role}</div>
                  </div>
                </div>
              </Card>

              {/* Testimonial 2 */}
              <Card className="p-8 hover-scale border-2 hover:border-secondary/30 transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{settings.testimonial_2_text}"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-secondary/20">
                    <AvatarImage src={settings.testimonial_2_avatar} />
                    <AvatarFallback className="bg-secondary/10 text-secondary font-bold">
                      {settings.testimonial_2_author?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{settings.testimonial_2_author}</div>
                    <div className="text-sm text-muted-foreground">{settings.testimonial_2_role}</div>
                  </div>
                </div>
              </Card>

              {/* Testimonial 3 */}
              <Card className="p-8 hover-scale border-2 hover:border-accent/30 transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{settings.testimonial_3_text}"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-accent/20">
                    <AvatarImage src={settings.testimonial_3_avatar} />
                    <AvatarFallback className="bg-accent/10 text-accent font-bold">
                      {settings.testimonial_3_author?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{settings.testimonial_3_author}</div>
                    <div className="text-sm text-muted-foreground">{settings.testimonial_3_role}</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Final */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:40px_40px]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-primary/20">
              <Zap className="w-3 h-3 mr-2 inline" />
              Comece Agora
            </Badge>
            
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                {settings.cta_title}
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {settings.cta_subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="text-lg px-10 py-7 rounded-full hover-scale shadow-2xl group"
                onClick={() => navigate('/auth')}
              >
                {settings.cta_button_text}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-7 rounded-full hover-scale border-2"
                onClick={() => navigate('/auth')}
              >
                Ver Demonstração
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>14 dias grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Sem taxas escondidas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Moderno e Completo */}
      <footer className="border-t bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-12 max-w-6xl mx-auto">
            {/* Logo e Descrição */}
            <div className="md:col-span-2 space-y-4">
              {settings.logo_url && (
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="h-10 w-auto mb-4"
                />
              )}
              <p className="text-muted-foreground leading-relaxed">
                {settings.footer_company_description}
              </p>
              <div className="flex gap-3 pt-2">
                <a 
                  href={settings.social_twitter_url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={settings.social_twitter_url && settings.social_twitter_url !== '#' ? '' : 'pointer-events-none opacity-50'}
                >
                  <Button size="icon" variant="outline" className="rounded-full hover-scale">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                  </Button>
                </a>
                <a 
                  href={settings.social_github_url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={settings.social_github_url && settings.social_github_url !== '#' ? '' : 'pointer-events-none opacity-50'}
                >
                  <Button size="icon" variant="outline" className="rounded-full hover-scale">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  </Button>
                </a>
                <a 
                  href={settings.social_linkedin_url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={settings.social_linkedin_url && settings.social_linkedin_url !== '#' ? '' : 'pointer-events-none opacity-50'}
                >
                  <Button size="icon" variant="outline" className="rounded-full hover-scale">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </Button>
                </a>
              </div>
            </div>

            {/* Links Úteis */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Links Úteis</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href={settings.footer_link_1_url || '#'} 
                    className={`text-muted-foreground hover:text-primary transition-colors ${!settings.footer_link_1_url || settings.footer_link_1_url === '#' ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    {settings.footer_link_1_text}
                  </a>
                </li>
                <li>
                  <a 
                    href={settings.footer_link_2_url || '#'} 
                    className={`text-muted-foreground hover:text-primary transition-colors ${!settings.footer_link_2_url || settings.footer_link_2_url === '#' ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    {settings.footer_link_2_text}
                  </a>
                </li>
                <li>
                  <a 
                    href={settings.footer_link_3_url || '#'} 
                    className={`text-muted-foreground hover:text-primary transition-colors ${!settings.footer_link_3_url || settings.footer_link_3_url === '#' ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    {settings.footer_link_3_text}
                  </a>
                </li>
                <li>
                  <a 
                    href={settings.footer_link_4_url || '#'} 
                    className={`text-muted-foreground hover:text-primary transition-colors ${!settings.footer_link_4_url || settings.footer_link_4_url === '#' ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    {settings.footer_link_4_text}
                  </a>
                </li>
              </ul>
            </div>

            {/* Suporte */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Suporte</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <a 
                    href={settings.support_help_url || '#'} 
                    className={`hover:text-primary transition-colors ${!settings.support_help_url || settings.support_help_url === '#' ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Central de Ajuda
                  </a>
                </li>
                <li>
                  <a 
                    href={settings.support_docs_url || '#'} 
                    className={`hover:text-primary transition-colors ${!settings.support_docs_url || settings.support_docs_url === '#' ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Documentação
                  </a>
                </li>
                <li>
                  <a 
                    href={settings.support_status_url || '#'} 
                    className={`hover:text-primary transition-colors ${!settings.support_status_url || settings.support_status_url === '#' ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Status do Sistema
                  </a>
                </li>
                <li>
                  <a 
                    href={settings.support_contact_url || '#'} 
                    className={`hover:text-primary transition-colors ${!settings.support_contact_url || settings.support_contact_url === '#' ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Contato
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>{settings.footer_text}</p>
            <div className="flex gap-6">
              <a 
                href={settings.legal_terms_url || '#'} 
                className={`hover:text-primary transition-colors ${!settings.legal_terms_url || settings.legal_terms_url === '#' ? 'pointer-events-none opacity-50' : ''}`}
              >
                Termos de Uso
              </a>
              <a 
                href={settings.legal_privacy_url || '#'} 
                className={`hover:text-primary transition-colors ${!settings.legal_privacy_url || settings.legal_privacy_url === '#' ? 'pointer-events-none opacity-50' : ''}`}
              >
                Privacidade
              </a>
              <a 
                href={settings.legal_cookies_url || '#'} 
                className={`hover:text-primary transition-colors ${!settings.legal_cookies_url || settings.legal_cookies_url === '#' ? 'pointer-events-none opacity-50' : ''}`}
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
