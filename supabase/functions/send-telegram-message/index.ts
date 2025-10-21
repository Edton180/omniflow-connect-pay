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
    const { chatId, message, botToken } = await req.json();

    if (!chatId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: chatId, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get bot token from channel_configs if not provided
    let telegramBotToken = botToken;

    if (!telegramBotToken) {
      const { data: configs } = await supabaseAdmin
        .from("channel_configs")
        .select("api_key_encrypted, config")
        .eq("config_type", "telegram")
        .eq("is_active", true)
        .limit(1);

      if (!configs || configs.length === 0) {
        return new Response(
          JSON.stringify({ error: "Telegram not configured" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      telegramBotToken = configs[0].config?.bot_token || configs[0].api_key_encrypted;
    }

    if (!telegramBotToken) {
      return new Response(
        JSON.stringify({ error: "Bot token not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Telegram API error:", data);
      return new Response(
        JSON.stringify({ error: data.description || "Failed to send message" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Telegram message sent successfully:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending Telegram message:", error);
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
