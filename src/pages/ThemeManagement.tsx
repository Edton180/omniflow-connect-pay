import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Palette, Check, Calendar, Eye } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { ThemeEffects } from "@/components/theme/ThemeEffects";

interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string | null;
  background_gradient: string | null;
  icon: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

export default function ThemeManagement() {
  const queryClient = useQueryClient();
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  const { data: themes, isLoading } = useQuery({
    queryKey: ["global-themes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_themes")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Theme[];
    },
  });

  const activateThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      // Desativar todos os temas
      await supabase
        .from("global_themes")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // Ativar o tema selecionado
      const { error } = await supabase
        .from("global_themes")
        .update({ is_active: true })
        .eq("id", themeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-themes"] });
      queryClient.invalidateQueries({ queryKey: ["active-theme"] });
      toast.success("Tema ativado com sucesso!");
      // Recarregar a página para aplicar o tema
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (error) => {
      console.error("Erro ao ativar tema:", error);
      toast.error("Erro ao ativar tema");
    },
  });

  const deactivateThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const { error } = await supabase
        .from("global_themes")
        .update({ is_active: false })
        .eq("id", themeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-themes"] });
      queryClient.invalidateQueries({ queryKey: ["active-theme"] });
      toast.success("Tema desativado com sucesso!");
      // Recarregar a página para aplicar o tema padrão
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (error) => {
      console.error("Erro ao desativar tema:", error);
      toast.error("Erro ao desativar tema");
    },
  });

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="h-8 w-8 text-primary" />
            Temas Globais
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie temas sazonais e especiais do sistema
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-40 bg-muted" />
                <CardContent className="space-y-2 pt-4">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes?.map((theme) => (
              <Card
                key={theme.id}
                className={`overflow-hidden transition-all ${
                  theme.is_active ? "ring-2 ring-primary" : ""
                }`}
              >
                <CardHeader
                  className="relative h-40 flex items-center justify-center text-6xl"
                  style={{
                    background: theme.background_gradient || theme.primary_color,
                  }}
                >
                  {theme.icon}
                  {theme.is_active && (
                    <Badge className="absolute top-2 right-2 bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <CardTitle className="flex items-center justify-between">
                      {theme.name}
                    </CardTitle>
                    {theme.description && (
                      <CardDescription className="mt-1">
                        {theme.description}
                      </CardDescription>
                   )}
                  </div>

                  {previewTheme === theme.slug && (
                    <div className="relative h-40 border rounded-lg overflow-hidden bg-muted/30 mb-4">
                      <ThemeEffects themeSlug={theme.slug} />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Badge variant="outline" className="bg-background/80">
                          Preview dos Efeitos
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: theme.primary_color }}
                      title="Cor Primária"
                    />
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: theme.secondary_color }}
                      title="Cor Secundária"
                    />
                    {theme.accent_color && (
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: theme.accent_color }}
                        title="Cor de Destaque"
                      />
                    )}
                  </div>

                  {(theme.start_date || theme.end_date) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {theme.start_date && new Date(theme.start_date).toLocaleDateString("pt-BR")}
                        {theme.start_date && theme.end_date && " - "}
                        {theme.end_date && new Date(theme.end_date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTheme(previewTheme === theme.slug ? null : theme.slug)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {previewTheme === theme.slug ? "Ocultar" : "Preview"}
                    </Button>
                    {theme.is_active ? (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => deactivateThemeMutation.mutate(theme.id)}
                        disabled={deactivateThemeMutation.isPending}
                      >
                        Desativar
                      </Button>
                    ) : (
                      <Button
                        className="flex-1"
                        onClick={() => activateThemeMutation.mutate(theme.id)}
                        disabled={activateThemeMutation.isPending}
                      >
                        Ativar Tema
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
