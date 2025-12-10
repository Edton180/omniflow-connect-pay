import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, channelId, templateId, templateData } = await req.json();

    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("*, tenant_id")
      .eq("id", channelId)
      .single();

    if (channelError || !channel) {
      throw new Error("Canal não encontrado");
    }

    const config = channel.config as { access_token?: string; business_account_id?: string };
    if (!config?.access_token || !config?.business_account_id) {
      throw new Error("Credenciais WABA não configuradas");
    }

    const graphApiUrl = "https://graph.facebook.com/v18.0";
    const headers = {
      Authorization: `Bearer ${config.access_token}`,
      "Content-Type": "application/json",
    };

    switch (action) {
      case "list": {
        const response = await fetch(
          `${graphApiUrl}/${config.business_account_id}/message_templates?limit=100`,
          { headers }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Erro ao listar");
        
        for (const template of data.data || []) {
          await supabase.from("waba_templates").upsert({
            tenant_id: channel.tenant_id,
            channel_id: channelId,
            template_id: template.id,
            template_name: template.name,
            language: template.language,
            category: template.category,
            status: template.status,
            components: template.components,
            last_synced_at: new Date().toISOString(),
          }, { onConflict: "channel_id,template_name,language" });
        }
        return new Response(JSON.stringify({ templates: data.data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const response = await fetch(
          `${graphApiUrl}/${config.business_account_id}/message_templates?name=${templateData?.name}`,
          { method: "DELETE", headers }
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || "Erro ao excluir");
        }
        await supabase.from("waba_templates").delete()
          .eq("channel_id", channelId).eq("template_name", templateData?.name);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }
  } catch (error) {
    console.error("Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
