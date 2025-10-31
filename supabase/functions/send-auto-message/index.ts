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
    const { channelId, contactId, ticketId, messageType } = await req.json();

    console.log("📤 Enviando mensagem automática:", { channelId, contactId, ticketId, messageType });

    if (!channelId || !contactId || !ticketId) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Buscar configurações do canal
    const { data: channel, error: channelError } = await supabaseAdmin
      .from("channels")
      .select("*")
      .eq("id", channelId)
      .single();

    if (channelError || !channel) {
      console.error("❌ Canal não encontrado:", channelError);
      return new Response(
        JSON.stringify({ error: "Canal não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chatbotConfig = channel.chatbot_config || {};
    let messageToSend = "";

    // Determinar mensagem baseada no tipo
    switch (messageType) {
      case "greeting":
        messageToSend = chatbotConfig.greeting_message || "Olá! Bem-vindo ao nosso atendimento.";
        break;
      case "menu":
        messageToSend = chatbotConfig.main_menu_message || "Como posso ajudar você hoje?";
        break;
      case "timeout":
        messageToSend = chatbotConfig.timeout_message || "Não recebi resposta. Encerrando atendimento.";
        break;
      case "outside_hours":
        messageToSend = chatbotConfig.outside_hours_message || "Estamos fora do horário de atendimento.";
        break;
      default:
        messageToSend = "Mensagem automática";
    }

    // Buscar contato para obter informações de envio
    const { data: contact, error: contactError } = await supabaseAdmin
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .single();

    if (contactError || !contact) {
      console.error("❌ Contato não encontrado:", contactError);
      return new Response(
        JSON.stringify({ error: "Contato não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Registrar mensagem no banco
    const { data: message, error: messageError } = await supabaseAdmin
      .from("messages")
      .insert({
        ticket_id: ticketId,
        content: messageToSend,
        is_from_contact: false,
        status: "sending",
      })
      .select()
      .single();

    if (messageError) {
      console.error("❌ Erro ao registrar mensagem:", messageError);
      throw messageError;
    }

    // Enviar mensagem via canal apropriado
    let sendResult: any = null;

    if (channel.type === "telegram") {
      const chatId = contact.metadata?.telegram_chat_id;
      if (chatId) {
        const { data, error } = await supabaseAdmin.functions.invoke("send-telegram-media", {
          body: {
            chatId: String(chatId),
            message: messageToSend,
            messageId: message.id,
          },
        });
        sendResult = { data, error };
      }
    } else if (channel.type === "whatsapp") {
      const phoneNumber = contact.phone;
      if (phoneNumber) {
        const { data, error } = await supabaseAdmin.functions.invoke("send-waba-message", {
          body: {
            to: phoneNumber,
            message: messageToSend,
          },
        });
        sendResult = { data, error };
      }
    }

    if (sendResult?.error) {
      console.error("❌ Erro ao enviar:", sendResult.error);
      await supabaseAdmin
        .from("messages")
        .update({ status: "failed" })
        .eq("id", message.id);

      return new Response(
        JSON.stringify({ success: false, error: sendResult.error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Atualizar status para enviado
    await supabaseAdmin
      .from("messages")
      .update({ status: "sent" })
      .eq("id", message.id);

    console.log("✅ Mensagem automática enviada com sucesso");

    return new Response(
      JSON.stringify({ success: true, message: "Mensagem enviada" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem automática:", error);
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