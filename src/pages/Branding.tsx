import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Zap, LogOut, Upload, Palette, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Branding() {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    primary_color: "#8B5CF6",
    secondary_color: "#3B82F6",
    custom_domain: "",
  });

  useEffect(() => {
    if (session?.user) {
      loadTenantData();
    } else {
      setLoading(false);
    }
  }, [session]);

  const loadTenantData = async () => {
    try {
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", session?.user?.id)
        .maybeSingle();

      if (roleError) throw roleError;

      if (!userRole?.tenant_id) {
        setLoading(false);
        toast({
          title: "Aviso",
          description: "Você precisa estar associado a uma empresa para personalizar a marca",
          variant: "destructive",
        });
        return;
      }

      const { data: tenantData, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", userRole.tenant_id)
        .single();

      if (error) throw error;

      setTenant(tenantData);
      setFormData({
        name: tenantData.name || "",
        primary_color: tenantData.primary_color || "#8B5CF6",
        secondary_color: tenantData.secondary_color || "#3B82F6",
        custom_domain: tenantData.custom_domain || "",
      });
      setLogoPreview(tenantData.logo_url || "");
    } catch (error: any) {
      console.error("Error loading tenant:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile || !tenant) return null;

    const fileExt = logoFile.name.split(".").pop();
    const fileName = `${tenant.id}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("tenant-logos")
      .upload(fileName, logoFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("tenant-logos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!tenant) return;

    setLoading(true);
    try {
      let logoUrl = tenant.logo_url;

      if (logoFile) {
        logoUrl = await uploadLogo();
      }

      const { error } = await supabase
        .from("tenants")
        .update({
          name: formData.name,
          logo_url: logoUrl,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          custom_domain: formData.custom_domain,
        })
        .eq("id", tenant.id);

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "Suas personalizações foram aplicadas com sucesso.",
      });

      loadTenantData();
    } catch (error: any) {
      console.error("Error saving branding:", error);
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
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white shadow-glow">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Marca Branca</h1>
              <p className="text-xs text-muted-foreground">Personalize sua plataforma</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gradient">Personalização de Marca</h2>
          <p className="text-muted-foreground">
            Configure a identidade visual da sua plataforma
          </p>
        </div>

        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="branding">
              <Palette className="w-4 h-4 mr-2" />
              Marca
            </TabsTrigger>
            <TabsTrigger value="colors">
              <Palette className="w-4 h-4 mr-2" />
              Cores
            </TabsTrigger>
            <TabsTrigger value="domain">
              <Globe className="w-4 h-4 mr-2" />
              Domínio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-6">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle>Informações da Marca</CardTitle>
                <CardDescription>Nome e logo da sua plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Plataforma</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome da sua empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo da Plataforma</Label>
                  <div className="flex items-center gap-4">
                    {logoPreview && (
                      <div className="w-32 h-32 border-2 border-border rounded-lg overflow-hidden bg-card flex items-center justify-center">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Label
                        htmlFor="logo-upload"
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {logoFile ? "Trocar Logo" : "Upload Logo"}
                      </Label>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG ou SVG. Máximo 2MB.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="space-y-6">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle>Paleta de Cores</CardTitle>
                <CardDescription>Defina as cores da sua marca</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
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
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.primary_color}
                        onChange={(e) =>
                          setFormData({ ...formData, primary_color: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                    <div
                      className="h-20 rounded-lg border-2 border-border"
                      style={{ backgroundColor: formData.primary_color }}
                    />
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
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.secondary_color}
                        onChange={(e) =>
                          setFormData({ ...formData, secondary_color: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                    <div
                      className="h-20 rounded-lg border-2 border-border"
                      style={{ backgroundColor: formData.secondary_color }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <div className="flex gap-2">
                    <Button style={{ backgroundColor: formData.primary_color }}>
                      Botão Primário
                    </Button>
                    <Button
                      variant="outline"
                      style={{ borderColor: formData.secondary_color, color: formData.secondary_color }}
                    >
                      Botão Secundário
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domain" className="space-y-6">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle>Domínio Personalizado</CardTitle>
                <CardDescription>Configure seu domínio próprio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="custom_domain">Seu Domínio</Label>
                  <Input
                    id="custom_domain"
                    value={formData.custom_domain}
                    onChange={(e) =>
                      setFormData({ ...formData, custom_domain: e.target.value })
                    }
                    placeholder="seudominio.com.br"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: atendimento.suaempresa.com.br
                  </p>
                </div>

                <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Como configurar seu domínio
                  </h4>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Acesse o painel do seu provedor de domínio</li>
                    <li>Adicione um registro A apontando para: 185.158.133.1</li>
                    <li>Aguarde a propagação DNS (até 48 horas)</li>
                    <li>O SSL será configurado automaticamente</li>
                  </ol>
                  <p className="text-xs text-muted-foreground">
                    Para mais detalhes, consulte a documentação do Lovable sobre domínios personalizados.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
