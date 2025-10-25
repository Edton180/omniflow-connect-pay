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
    const { messageId, chatId, telegramMessageId, botToken } = await req.json();

    console.log("🗑️ Deletando mensagem:", { messageId, chatId, telegramMessageId });

    if (!messageId || !chatId || !telegramMessageId) {
      return new Response(
        JSON.stringify({ error: "messageId, chatId e telegramMessageId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

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
        return new Response(
          JSON.stringify({ error: "Telegram não configurado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      telegramBotToken = configs[0].config?.bot_token;
    }

    if (!telegramBotToken) {
      return new Response(
        JSON.stringify({ error: "Token do bot não encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deletar mensagem via API do Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/deleteMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: telegramMessageId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erro ao deletar mensagem no Telegram:", data);
      return new Response(
        JSON.stringify({ 
          error: data.description || "Falha ao deletar mensagem",
          details: data 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Marcar mensagem como deletada no banco de dados
    await supabaseAdmin
      .from("messages")
      .update({ 
        deleted_at: new Date().toISOString(),
        status: "deleted"
      })
      .eq("id", messageId);

    console.log("✅ Mensagem deletada com sucesso");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Mensagem deletada com sucesso"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro ao deletar mensagem:", error);
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