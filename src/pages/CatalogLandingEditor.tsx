import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, LogOut, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function CatalogLandingEditor() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    hero_title: "Nosso Catálogo",
    hero_subtitle: "Confira nossos produtos",
    hero_image_url: "",
    logo_url: "",
    primary_color: "#8B5CF6",
    secondary_color: "#3B82F6",
    footer_text: "© 2025 Todos os direitos reservados.",
    seo_title: "",
    seo_description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!user?.id) return;

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!userRole?.tenant_id) {
        toast({
          title: "Erro",
          description: "Você precisa estar associado a uma empresa",
          variant: "destructive",
        });
        return;
      }

      setTenantId(userRole.tenant_id);

      const { data: settings } = await supabase
        .from("catalog_landing_settings")
        .select("*")
        .eq("tenant_id", userRole.tenant_id)
        .maybeSingle();

      if (settings) {
        setFormData({
          hero_title: settings.hero_title,
          hero_subtitle: settings.hero_subtitle || "",
          hero_image_url: settings.hero_image_url || "",
          logo_url: settings.logo_url || "",
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          footer_text: settings.footer_text,
          seo_title: settings.seo_title || "",
          seo_description: settings.seo_description || "",
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
    if (!tenantId) return;

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("catalog_landing_settings")
        .select("id")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      const settingsData = {
        tenant_id: tenantId,
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from("catalog_landing_settings")
          .update(settingsData)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("catalog_landing_settings")
          .insert(settingsData);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
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
              <h1 className="text-xl font-bold">Editor Landing Page - Catálogo</h1>
              <p className="text-xs text-foreground/60">Personalize sua página de catálogo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título Principal</Label>
                <Input
                  value={formData.hero_title}
                  onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                  placeholder="Nosso Catálogo"
                />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input
                  value={formData.hero_subtitle}
                  onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                  placeholder="Confira nossos produtos"
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
                    placeholder="#8B5CF6"
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
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título SEO</Label>
                <Input
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  placeholder="Título para motores de busca"
                  maxLength={60}
                />
                <p className="text-xs text-foreground/60 mt-1">{formData.seo_title.length}/60 caracteres</p>
              </div>
              <div>
                <Label>Descrição SEO</Label>
                <Textarea
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  placeholder="Descrição para motores de busca"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-foreground/60 mt-1">{formData.seo_description.length}/160 caracteres</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Footer</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Texto do Rodapé</Label>
                <Input
                  value={formData.footer_text}
                  onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                  placeholder="© 2025 Todos os direitos reservados."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
