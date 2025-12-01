import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GlobalTheme {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string | null;
  background_gradient: string | null;
  is_active: boolean;
}

export function useGlobalTheme() {
  const { data: activeTheme } = useQuery({
    queryKey: ["active-theme"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_themes")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching active theme:", error);
        return null;
      }
      
      return data as GlobalTheme | null;
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  useEffect(() => {
    if (!activeTheme) return;

    // Converter hex para HSL
    const hexToHSL = (hex: string) => {
      // Remove o # se existir
      hex = hex.replace(/^#/, "");

      // Converte para RGB
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
          case g:
            h = ((b - r) / d + 2) / 6;
            break;
          case b:
            h = ((r - g) / d + 4) / 6;
            break;
        }
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // Aplicar cores do tema
    const root = document.documentElement;
    
    // Cores principais
    root.style.setProperty("--primary", hexToHSL(activeTheme.primary_color));
    root.style.setProperty("--secondary", hexToHSL(activeTheme.secondary_color));
    
    if (activeTheme.accent_color) {
      root.style.setProperty("--accent", hexToHSL(activeTheme.accent_color));
    }

    // Gradiente de fundo se disponível
    if (activeTheme.background_gradient) {
      root.style.setProperty("--gradient-primary", activeTheme.background_gradient);
    }

    // Adicionar classe de tema ao body para efeitos especiais
    document.body.classList.add(`theme-${activeTheme.slug}`);

    // Cleanup
    return () => {
      document.body.classList.remove(`theme-${activeTheme.slug}`);
    };
  }, [activeTheme]);

  return { activeTheme };
}
