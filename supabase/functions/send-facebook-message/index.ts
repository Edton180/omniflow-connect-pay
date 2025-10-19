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
    const { recipientId, message, platform, pageAccessToken } = await req.json();

    if (!recipientId || !message || !platform) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: recipientId, message, platform" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get credentials from channel_configs if not provided
    let accessToken = pageAccessToken;

    if (!accessToken) {
      const configType = platform === "instagram" ? "instagram" : "facebook";
      const { data: configs } = await supabaseAdmin
        .from("channel_configs")
        .select("api_key_encrypted")
        .eq("config_type", configType)
        .eq("is_active", true)
        .limit(1);

      if (!configs || configs.length === 0) {
        return new Response(
          JSON.stringify({ error: `${platform} not configured` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      accessToken = configs[0].api_key_encrypted;
    }

    // Send message via Facebook/Instagram
    const endpoint = platform === "instagram" 
      ? `https://graph.facebook.com/v18.0/me/messages`
      : `https://graph.facebook.com/v18.0/me/messages`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: accessToken,
        recipient: {
          id: recipientId,
        },
        message: {
          text: message,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`${platform} API error:`, data);
      return new Response(
        JSON.stringify({ error: data.error?.message || "Failed to send message" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`${platform} message sent successfully:`, data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending message:", error);
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
