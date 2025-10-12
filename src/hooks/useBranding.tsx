import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface BrandingConfig {
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  custom_domain: string | null;
}

export const useBranding = () => {
  const { session } = useAuth();
  const [branding, setBranding] = useState<BrandingConfig>({
    name: "OmniFlow",
    logo_url: null,
    primary_color: "#8B5CF6",
    secondary_color: "#3B82F6",
    custom_domain: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadBranding();
    } else {
      setLoading(false);
    }
  }, [session]);

  const loadBranding = async () => {
    try {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", session?.user?.id)
        .single();

      if (!userRole?.tenant_id) {
        setLoading(false);
        return;
      }

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("name, logo_url, primary_color, secondary_color, custom_domain")
        .eq("id", userRole.tenant_id)
        .single();

      if (tenantData) {
        setBranding({
          name: tenantData.name || "OmniFlow",
          logo_url: tenantData.logo_url,
          primary_color: tenantData.primary_color || "#8B5CF6",
          secondary_color: tenantData.secondary_color || "#3B82F6",
          custom_domain: tenantData.custom_domain,
        });

        // Apply colors dynamically
        applyColors(
          tenantData.primary_color || "#8B5CF6",
          tenantData.secondary_color || "#3B82F6"
        );
      }
    } catch (error) {
      console.error("Error loading branding:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyColors = (primaryColor: string, secondaryColor: string) => {
    const root = document.documentElement;

    // Convert hex to HSL for CSS variables
    const hexToHSL = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return "262 83% 58%";

      const r = parseInt(result[1], 16) / 255;
      const g = parseInt(result[2], 16) / 255;
      const b = parseInt(result[3], 16) / 255;

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

    root.style.setProperty("--primary", hexToHSL(primaryColor));
    root.style.setProperty("--secondary", hexToHSL(secondaryColor));
  };

  return { branding, loading };
};
