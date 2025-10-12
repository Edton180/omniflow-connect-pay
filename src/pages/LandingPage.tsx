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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-hero min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {settings.logo_url && (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="h-16 w-auto mx-auto mb-8"
              />
            )}
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
              {settings.hero_title}
            </h1>
            <p className="text-xl text-white/90 mb-8 animate-fade-in">
              {settings.hero_subtitle}
            </p>
            <Button
              size="lg"
              className="text-lg px-8 py-6 hover-scale animate-fade-in"
              onClick={() => navigate('/auth')}
            >
              {settings.hero_cta_text}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="gradient-card hover-scale">
              <CardHeader>
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${settings.primary_color}15` }}
                >
                  <Feature1Icon 
                    className="w-6 h-6"
                    style={{ color: settings.primary_color }}
                  />
                </div>
                <CardTitle>{settings.feature_1_title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {settings.feature_1_description}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="gradient-card hover-scale">
              <CardHeader>
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${settings.secondary_color}15` }}
                >
                  <Feature2Icon 
                    className="w-6 h-6"
                    style={{ color: settings.secondary_color }}
                  />
                </div>
                <CardTitle>{settings.feature_2_title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {settings.feature_2_description}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="gradient-card hover-scale">
              <CardHeader>
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${settings.primary_color}15` }}
                >
                  <Feature3Icon 
                    className="w-6 h-6"
                    style={{ color: settings.primary_color }}
                  />
                </div>
                <CardTitle>{settings.feature_3_title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {settings.feature_3_description}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            {settings.footer_text}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
