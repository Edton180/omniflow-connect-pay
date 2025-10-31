import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // GET request - Webhook verification from Meta
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      console.log("WABA webhook verification:", { mode, token });

      // Get verify token from channel_configs
      const { data: configs } = await supabaseAdmin
        .from("channel_configs")
        .select("config")
        .eq("config_type", "waba")
        .eq("is_active", true)
        .limit(1);

      if (!configs || configs.length === 0) {
        console.error("No active WABA config found");
        return new Response("No active WABA config", { status: 403 });
      }

      const verifyToken = configs[0].config?.verify_token;

      if (mode === "subscribe" && token === verifyToken) {
        console.log("WABA webhook verified successfully");
        return new Response(challenge, { status: 200 });
      }

      return new Response("Forbidden", { status: 403 });
    }

    // POST request - Process incoming webhook
    const body = await req.json();
    console.log("WABA webhook received:", JSON.stringify(body));

    // Process WhatsApp message
    if (body.entry && body.entry[0]?.changes) {
      for (const change of body.entry[0].changes) {
        if (change.value?.messages) {
          for (const message of change.value.messages) {
            const phoneNumber = message.from;
            const messageText = message.text?.body || message.caption || "";
            const messageType = message.type;

            // Get tenant from active WABA channel
            const { data: channels } = await supabaseAdmin
              .from("channels")
              .select("*, tenants(id)")
              .eq("type", "whatsapp")
              .eq("status", "active")
              .limit(1);

            if (!channels || channels.length === 0) {
              console.log("No active WhatsApp channel found");
              continue;
            }

            const channel = channels[0];
            const tenantId = channel.tenant_id;

            // Find or create contact
            let contact;
            const { data: existingContacts } = await supabaseAdmin
              .from("contacts")
              .select("*")
              .eq("tenant_id", tenantId)
              .eq("phone", phoneNumber)
              .maybeSingle();

            if (existingContacts) {
              contact = existingContacts;
            } else {
              const { data: newContact, error: contactError } = await supabaseAdmin
                .from("contacts")
                .insert({
                  tenant_id: tenantId,
                  name: change.value.contacts?.[0]?.profile?.name || phoneNumber,
                  phone: phoneNumber,
                  metadata: {
                    waba_profile: change.value.contacts?.[0]?.profile,
                  },
                })
                .select()
                .single();

              if (contactError) {
                console.error("Error creating contact:", contactError);
                continue;
              }
              contact = newContact;
            }

            // Find or create ticket
            let ticket;
            const { data: existingTickets } = await supabaseAdmin
              .from("tickets")
              .select("*")
              .eq("contact_id", contact.id)
              .in("status", ["open", "in_progress", "pending"])
              .maybeSingle();

            if (existingTickets) {
              ticket = existingTickets;
              await supabaseAdmin
                .from("tickets")
                .update({ 
                  last_message: messageText, 
                  updated_at: new Date().toISOString() 
                })
                .eq("id", ticket.id);
            } else {
              const { data: newTicket, error: ticketError } = await supabaseAdmin
                .from("tickets")
                .insert({
                  tenant_id: tenantId,
                  contact_id: contact.id,
                  channel: "whatsapp",
                  status: "open",
                  priority: "medium",
                  last_message: messageText,
                })
                .select()
                .single();

              if (ticketError) {
                console.error("Error creating ticket:", ticketError);
                continue;
              }
              ticket = newTicket;
            }

            // Create message
            const messageData: any = {
              ticket_id: ticket.id,
              contact_id: contact.id,
              content: messageText,
              is_from_contact: true,
            };

            // Handle media
            if (message.type === "image" && message.image) {
              messageData.media_type = "image";
              messageData.media_url = message.image.id;
            } else if (message.type === "video" && message.video) {
              messageData.media_type = "video";
              messageData.media_url = message.video.id;
            } else if (message.type === "audio" && message.audio) {
              messageData.media_type = "audio";
              messageData.media_url = message.audio.id;
            } else if (message.type === "document" && message.document) {
              messageData.media_type = "document";
              messageData.media_url = message.document.id;
            }

            await supabaseAdmin.from("messages").insert(messageData);

            console.log(`WABA message processed for ticket ${ticket.id}`);

            // Enviar mensagem automática se for novo ticket
            if (!existingTickets) {
              console.log("🤖 Novo ticket detectado, enviando mensagem de boas-vindas");
              try {
                await supabaseAdmin.functions.invoke("send-auto-message", {
                  body: {
                    channelId: channel.id,
                    contactId: contact.id,
                    ticketId: ticket.id,
                    messageType: "greeting",
                  },
                });
              } catch (autoError) {
                console.error("⚠️ Erro ao enviar mensagem automática:", autoError);
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing WABA webhook:", error);
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
