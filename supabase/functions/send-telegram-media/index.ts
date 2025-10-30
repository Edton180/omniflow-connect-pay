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
    const { chatId, message, mediaUrl, mediaType, botToken, messageId } = await req.json();

    console.log("📤 Pedido de envio recebido:", { chatId, message, mediaUrl, mediaType, messageId });

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: "Campo obrigatório ausente: chatId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Atualizar status da mensagem para "sending"
    if (messageId) {
      await supabaseAdmin
        .from("messages")
        .update({ status: "sending" })
        .eq("id", messageId);
    }

    // Obter bot token se não fornecido
    let telegramBotToken = botToken;

    if (!telegramBotToken) {
      const { data: configs } = await supabaseAdmin
        .from("channels")
        .select("config")
        .eq("type", "telegram")
        .eq("status", "active")
        .limit(1);

      if (!configs || configs.length === 0) {
        if (messageId) {
          await supabaseAdmin
            .from("messages")
            .update({ status: "failed" })
            .eq("id", messageId);
        }
        return new Response(
          JSON.stringify({ error: "Telegram não configurado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      telegramBotToken = configs[0].config?.bot_token;
    }

    if (!telegramBotToken) {
      if (messageId) {
        await supabaseAdmin
          .from("messages")
          .update({ status: "failed" })
          .eq("id", messageId);
      }
      return new Response(
        JSON.stringify({ error: "Token do bot não encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let endpoint = "";
    let body: any = {
      chat_id: chatId,
    };

    // Determinar endpoint e payload baseado no tipo de mídia
    if (!mediaUrl || !mediaType) {
      endpoint = "sendMessage";
      body.text = message || "Mensagem sem conteúdo";
      body.parse_mode = "HTML";
      console.log("💬 Enviando mensagem de texto");
    } else if (mediaType === "image" || mediaType === "img") {
      endpoint = "sendPhoto";
      body.photo = mediaUrl;
      if (message) body.caption = message;
      console.log("🖼️ Enviando foto");
    } else if (mediaType === "audio" || mediaType === "voice") {
      endpoint = "sendAudio";
      body.audio = mediaUrl;
      if (message) body.caption = message;
      console.log("🎵 Enviando áudio");
    } else if (mediaType === "video") {
      endpoint = "sendVideo";
      body.video = mediaUrl;
      if (message) body.caption = message;
      console.log("🎥 Enviando vídeo");
    } else if (mediaType === "sticker") {
      endpoint = "sendSticker";
      body.sticker = mediaUrl;
      console.log("😊 Enviando figurinha");
    } else if (mediaType === "document" || mediaType.includes("pdf") || mediaType.includes("doc")) {
      endpoint = "sendDocument";
      body.document = mediaUrl;
      if (message) body.caption = message;
      console.log("📄 Enviando documento");
    } else {
      // Usar sendDocument como fallback para tipos não reconhecidos
      endpoint = "sendDocument";
      body.document = mediaUrl;
      if (message) body.caption = message;
      console.log("📎 Enviando como documento (fallback) - tipo:", mediaType);
    }

    console.log(`🚀 Enviando para Telegram via ${endpoint}:`, JSON.stringify(body, null, 2));

    // Enviar mensagem via Telegram Bot API
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
      console.error("❌ Erro da API do Telegram:", data);
      
      // Atualizar status da mensagem para "failed"
      if (messageId) {
        await supabaseAdmin
          .from("messages")
          .update({ status: "failed" })
          .eq("id", messageId);
      }
      
      return new Response(
        JSON.stringify({ 
          error: data.description || "Falha ao enviar mensagem",
          details: data 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Mensagem enviada com sucesso:", data);

    // Atualizar status da mensagem para "sent" e salvar telegram_message_id
    if (messageId && data.result?.message_id) {
      await supabaseAdmin
        .from("messages")
        .update({ 
          status: "sent",
          telegram_message_id: data.result.message_id
        })
        .eq("id", messageId);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data,
      telegram_message_id: data.result?.message_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem do Telegram:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
