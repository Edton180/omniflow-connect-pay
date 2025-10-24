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
    const { chatId, message, mediaUrl, mediaType, botToken } = await req.json();

    console.log("Recebido pedido de envio:", { chatId, message, mediaUrl, mediaType });

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: chatId" }),
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
        .from("channels")
        .select("config")
        .eq("type", "telegram")
        .eq("status", "active")
        .limit(1);

      if (!configs || configs.length === 0) {
        return new Response(
          JSON.stringify({ error: "Telegram not configured" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      telegramBotToken = configs[0].config?.bot_token;
    }

    if (!telegramBotToken) {
      return new Response(
        JSON.stringify({ error: "Bot token not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let endpoint = "";
    let body: any = {
      chat_id: Number(chatId),
    };

    // Determinar endpoint e payload baseado no tipo de mídia
    if (!mediaUrl || !mediaType) {
      // Mensagem de texto simples
      endpoint = "sendMessage";
      body.text = message || "Mensagem sem conteúdo";
      body.parse_mode = "HTML";
    } else if (mediaType === "image") {
      endpoint = "sendPhoto";
      body.photo = mediaUrl;
      if (message) body.caption = message;
    } else if (mediaType === "audio") {
      endpoint = "sendAudio";
      body.audio = mediaUrl;
      if (message) body.caption = message;
    } else if (mediaType === "video") {
      endpoint = "sendVideo";
      body.video = mediaUrl;
      if (message) body.caption = message;
    } else if (mediaType === "document" || mediaType === "sticker") {
      endpoint = "sendDocument";
      body.document = mediaUrl;
      if (message) body.caption = message;
    } else {
      // Fallback para documento
      endpoint = "sendDocument";
      body.document = mediaUrl;
      if (message) body.caption = message;
    }

    console.log(`Enviando para Telegram via ${endpoint}:`, body);

    // Send message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Telegram API error:", data);
      return new Response(
        JSON.stringify({ 
          error: data.description || "Failed to send message",
          details: data 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Telegram message sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
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
