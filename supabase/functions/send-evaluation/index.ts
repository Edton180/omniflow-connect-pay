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
    const { ticketId, channel, contactPhone, contactId } = await req.json();

    console.log("📊 Sending evaluation request:", { ticketId, channel, contactPhone });

    if (!ticketId || !channel || !contactPhone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: ticketId, channel, contactPhone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get ticket info
    const { data: ticket } = await supabaseAdmin
      .from("tickets")
      .select("*, tenant_id")
      .eq("id", ticketId)
      .single();

    if (!ticket) {
      return new Response(
        JSON.stringify({ error: "Ticket not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get evaluation settings
    const { data: evalSettings } = await supabaseAdmin
      .from("evaluation_settings")
      .select("*")
      .eq("tenant_id", ticket.tenant_id)
      .maybeSingle();

    if (!evalSettings || !evalSettings.enabled) {
      console.log("⚠️ Evaluation system disabled or not configured");
      return new Response(
        JSON.stringify({ success: true, message: "Evaluation system disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build evaluation message based on rating scale
    let evaluationMessage = evalSettings.message_template;
    
    if (evalSettings.rating_scale === 3) {
      evaluationMessage += "\n\n1 - Ruim 😞\n2 - Bom 😊\n3 - Ótimo 🌟";
    } else if (evalSettings.rating_scale === 5) {
      evaluationMessage += "\n\n1 ⭐\n2 ⭐⭐\n3 ⭐⭐⭐\n4 ⭐⭐⭐⭐\n5 ⭐⭐⭐⭐⭐";
    } else if (evalSettings.rating_scale === 10) {
      evaluationMessage += "\n\nDigite um número de 0 (muito insatisfeito) a 10 (muito satisfeito)";
    }

    // Find channel
    const { data: channels } = await supabaseAdmin
      .from("channels")
      .select("id, config")
      .eq("tenant_id", ticket.tenant_id)
      .eq("type", channel)
      .eq("status", "active")
      .limit(1);

    if (!channels || channels.length === 0) {
      return new Response(
        JSON.stringify({ error: "Channel not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const channelData = channels[0];

    // Send evaluation based on channel
    let sendResult;
    if (channel === "telegram") {
      const botToken = channelData.config?.bot_token;
      if (!botToken) {
        return new Response(
          JSON.stringify({ error: "Telegram bot token not configured" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      sendResult = await supabaseAdmin.functions.invoke("send-telegram-message", {
        body: {
          chatId: contactPhone,
          message: evaluationMessage,
          botToken,
        },
      });
    } else if (channel === "whatsapp" || channel === "waba") {
      sendResult = await supabaseAdmin.functions.invoke("send-waba-message", {
        body: {
          to: contactPhone,
          message: evaluationMessage,
        },
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Channel not supported for evaluation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (sendResult.error) {
      console.error("❌ Error sending evaluation:", sendResult.error);
      return new Response(
        JSON.stringify({ error: "Failed to send evaluation", details: sendResult.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Evaluation sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Evaluation sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in send-evaluation:", error);
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