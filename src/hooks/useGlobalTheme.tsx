import { useEffect, useState } from "react";
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
  const [effectsEnabled, setEffectsEnabled] = useState(() => {
    const stored = localStorage.getItem("theme-effects-enabled");
    return stored !== "false";
  });

  const { data: activeTheme } = useQuery({
    queryKey: ["active-theme"],
    queryFn: async () => {
      try {
        // Buscar tema ativo - esta query funciona para todos os usuários
        // devido à RLS policy "Public can view active themes"
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
      } catch (err) {
        console.error("Failed to fetch theme:", err);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    refetchOnWindowFocus: false,
    retry: 1, // Tentar apenas uma vez em caso de erro
  });

  // Listen for toggle events from ThemeToggle
  useEffect(() => {
    const handleToggle = (e: CustomEvent) => {
      setEffectsEnabled(e.detail);
    };

    window.addEventListener("theme-effects-toggle" as any, handleToggle);
    return () => {
      window.removeEventListener("theme-effects-toggle" as any, handleToggle);
    };
  }, []);

  useEffect(() => {
    if (!activeTheme) return;

    // Converter hex para HSL
    const hexToHSL = (hex: string) => {
      if (!hex || !hex.startsWith('#')) return null;
      
      hex = hex.replace(/^#/, "");

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

    const root = document.documentElement;
    
    const primaryHSL = hexToHSL(activeTheme.primary_color);
    const secondaryHSL = hexToHSL(activeTheme.secondary_color);
    
    if (primaryHSL) {
      root.style.setProperty("--primary", primaryHSL);
    }
    
    if (secondaryHSL) {
      root.style.setProperty("--secondary", secondaryHSL);
    }
    
    if (activeTheme.accent_color) {
      const accentHSL = hexToHSL(activeTheme.accent_color);
      if (accentHSL) {
        root.style.setProperty("--accent", accentHSL);
      }
    }

    if (activeTheme.background_gradient) {
      root.style.setProperty("--gradient-primary", activeTheme.background_gradient);
    }

    document.body.classList.add(`theme-${activeTheme.slug}`);

    // Salvar tema aplicado no localStorage para persistência
    localStorage.setItem("applied-theme-id", activeTheme.id);

    return () => {
      document.body.classList.remove(`theme-${activeTheme.slug}`);
    };
  }, [activeTheme]);

  return { activeTheme, effectsEnabled, setEffectsEnabled };
}
