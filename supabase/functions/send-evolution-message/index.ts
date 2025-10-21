import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, instanceName, apiUrl, apiKey } = await req.json();

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get credentials from channel_configs if not provided
    let evolutionApiUrl = apiUrl;
    let evolutionApiKey = apiKey;
    let evolutionInstance = instanceName;

    if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
      const { data: configs } = await supabaseAdmin
        .from("channel_configs")
        .select("api_url, api_key_encrypted, config")
        .eq("config_type", "evolution")
        .eq("is_active", true)
        .limit(1);

      if (!configs || configs.length === 0) {
        return new Response(
          JSON.stringify({ error: "Evolution API not configured" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      evolutionApiUrl = configs[0].api_url;
      evolutionApiKey = configs[0].api_key_encrypted;
      evolutionInstance = configs[0].config?.instance_name;
    }

    // Send message via Evolution API
    const response = await fetch(
      `${evolutionApiUrl}/message/sendText/${evolutionInstance}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": evolutionApiKey,
        },
        body: JSON.stringify({
          number: to,
          text: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Evolution API error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to send message" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Evolution message sent successfully:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending Evolution message:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
