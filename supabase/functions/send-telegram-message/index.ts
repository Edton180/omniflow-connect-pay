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
    const { chatId, message, botToken, mediaUrl, mediaType } = await req.json();

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: chatId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!message && !mediaUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required field: message or mediaUrl" }),
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

    // Auto-assignment logic
    const authHeader = req.headers.get("authorization");
    let sendingUserId = null;
    
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        sendingUserId = userData?.user?.id;
        console.log("👤 Mensagem enviada por usuário:", sendingUserId);
      } catch (err) {
        console.log("⚠️ Não foi possível identificar usuário:", err);
      }
    }

    if (sendingUserId) {
      try {
        // Find contact by telegram chat_id in metadata
        const { data: contacts } = await supabaseAdmin
          .from("contacts")
          .select("id, tenant_id")
          .or(`phone.eq.${chatId},metadata->>telegram_chat_id.eq.${chatId}`);

        const contact = contacts?.[0];

        if (contact) {
          const { data: unassignedTickets } = await supabaseAdmin
            .from("tickets")
            .select("id, assigned_to")
            .eq("contact_id", contact.id)
            .eq("tenant_id", contact.tenant_id)
            .in("status", ["open", "pending"])
            .is("assigned_to", null);

          if (unassignedTickets && unassignedTickets.length > 0) {
            for (const ticket of unassignedTickets) {
              await supabaseAdmin
                .from("tickets")
                .update({ 
                  assigned_to: sendingUserId,
                  status: "open"
                })
                .eq("id", ticket.id);
              
              console.log(`✅ Ticket ${ticket.id} atribuído automaticamente ao agente ${sendingUserId}`);
            }
          }
        }
      } catch (err) {
        console.error("⚠️ Erro na atribuição automática:", err);
      }
    }

    let response;
    let data;

    // If media is present, send with appropriate method
    if (mediaUrl) {
      let method = "sendPhoto";
      let bodyKey = "photo";

      if (mediaType === "video") {
        method = "sendVideo";
        bodyKey = "video";
      } else if (mediaType === "audio") {
        method = "sendAudio";
        bodyKey = "audio";
      } else if (mediaType === "document") {
        method = "sendDocument";
        bodyKey = "document";
      }

      const body: any = {
        chat_id: chatId,
        [bodyKey]: mediaUrl,
      };

      if (message) {
        body.caption = message;
        body.parse_mode = "HTML";
      }

      response = await fetch(
        `https://api.telegram.org/bot${telegramBotToken}/${method}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      data = await response.json();
    } else {
      // Send text message only
      response = await fetch(
        `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "HTML",
          }),
        }
      );

      data = await response.json();
    }

    if (!response.ok) {
      console.error("Telegram API error:", data);
      return new Response(
        JSON.stringify({ error: data.description || "Failed to send message", success: false }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Telegram message sent successfully:", data);

    return new Response(JSON.stringify({ ...data, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
