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
    const { to, message, phoneNumberId, accessToken } = await req.json();

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
    let wabaPhoneId = phoneNumberId;
    let wabaAccessToken = accessToken;

    if (!wabaPhoneId || !wabaAccessToken) {
      const { data: configs } = await supabaseAdmin
        .from("channel_configs")
        .select("api_key_encrypted, config")
        .eq("config_type", "waba")
        .eq("is_active", true)
        .limit(1);

      if (!configs || configs.length === 0) {
        return new Response(
          JSON.stringify({ error: "WABA not configured" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      wabaAccessToken = configs[0].api_key_encrypted;
      wabaPhoneId = configs[0].config?.phone_number_id;
    }

    // Send message via WABA
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${wabaPhoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${wabaAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: {
            body: message,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("WABA API error:", data);
      return new Response(
        JSON.stringify({ error: data.error?.message || "Failed to send message" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("WABA message sent successfully:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending WABA message:", error);
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
