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

  const url = new URL(req.url);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // GET request - Webhook verification
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      console.log("Facebook webhook verification:", { mode, token });

      // Get verify token from channel_configs
      const { data: configs } = await supabaseAdmin
        .from("channel_configs")
        .select("config")
        .eq("config_type", "facebook")
        .eq("is_active", true)
        .limit(1);

      if (!configs || configs.length === 0) {
        console.error("No active Facebook config found");
        return new Response("No active config", { status: 403 });
      }

      const verifyToken = configs[0].config?.verify_token;

      if (mode === "subscribe" && token === verifyToken) {
        console.log("Facebook webhook verified successfully");
        return new Response(challenge, { status: 200 });
      }

      return new Response("Forbidden", { status: 403 });
    }

    // POST request - Process webhook
    const body = await req.json();
    console.log("Facebook webhook received:", JSON.stringify(body));

    if (body.entry) {
      for (const entry of body.entry) {
        // Process Messenger messages
        if (entry.messaging) {
          for (const event of entry.messaging) {
            if (event.message) {
              await processMessengerMessage(supabaseAdmin, event, "facebook");
            }
          }
        }

        // Process Instagram messages
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === "messages" && change.value?.message) {
              await processInstagramMessage(supabaseAdmin, change.value);
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
    console.error("Error processing Facebook webhook:", error);
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

async function processMessengerMessage(supabaseAdmin: any, event: any, channelType: string) {
  const senderId = event.sender.id;
  const messageText = event.message.text || "";

  // Get active channel
  const { data: channels } = await supabaseAdmin
    .from("channels")
    .select("*")
    .eq("type", channelType)
    .eq("status", "active")
    .limit(1);

  if (!channels || channels.length === 0) {
    console.log(`No active ${channelType} channel found`);
    return;
  }

  const channel = channels[0];
  const tenantId = channel.tenant_id;

  // Find or create contact
  let contact;
  const { data: existingContacts } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("metadata->>messenger_id", senderId)
    .maybeSingle();

  if (existingContacts) {
    contact = existingContacts;
  } else {
    const { data: newContact } = await supabaseAdmin
      .from("contacts")
      .insert({
        tenant_id: tenantId,
        name: `Messenger User ${senderId}`,
        metadata: {
          messenger_id: senderId,
        },
      })
      .select()
      .single();
    contact = newContact;
  }

  if (!contact) return;

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
      .update({ last_message: messageText, updated_at: new Date().toISOString() })
      .eq("id", ticket.id);
  } else {
    const { data: newTicket } = await supabaseAdmin
      .from("tickets")
      .insert({
        tenant_id: tenantId,
        contact_id: contact.id,
        channel: channelType,
        status: "open",
        priority: "medium",
        last_message: messageText,
      })
      .select()
      .single();
    ticket = newTicket;
  }

  if (!ticket) return;

  // Create message
  await supabaseAdmin.from("messages").insert({
    ticket_id: ticket.id,
    contact_id: contact.id,
    content: messageText,
    is_from_contact: true,
  });

  console.log(`${channelType} message processed for ticket ${ticket.id}`);
}

async function processInstagramMessage(supabaseAdmin: any, value: any) {
  const senderId = value.from.id;
  const messageText = value.message.text || "";

  // Get active Instagram channel
  const { data: channels } = await supabaseAdmin
    .from("channels")
    .select("*")
    .eq("type", "instagram")
    .eq("status", "active")
    .limit(1);

  if (!channels || channels.length === 0) {
    console.log("No active Instagram channel found");
    return;
  }

  const channel = channels[0];
  const tenantId = channel.tenant_id;

  // Find or create contact
  let contact;
  const { data: existingContacts } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("metadata->>instagram_id", senderId)
    .maybeSingle();

  if (existingContacts) {
    contact = existingContacts;
  } else {
    const { data: newContact } = await supabaseAdmin
      .from("contacts")
      .insert({
        tenant_id: tenantId,
        name: value.from.username || `Instagram User ${senderId}`,
        metadata: {
          instagram_id: senderId,
          instagram_username: value.from.username,
        },
      })
      .select()
      .single();
    contact = newContact;
  }

  if (!contact) return;

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
      .update({ last_message: messageText, updated_at: new Date().toISOString() })
      .eq("id", ticket.id);
  } else {
    const { data: newTicket } = await supabaseAdmin
      .from("tickets")
      .insert({
        tenant_id: tenantId,
        contact_id: contact.id,
        channel: "instagram",
        status: "open",
        priority: "medium",
        last_message: messageText,
      })
      .select()
      .single();
    ticket = newTicket;
  }

  if (!ticket) return;

  // Create message
  await supabaseAdmin.from("messages").insert({
    ticket_id: ticket.id,
    contact_id: contact.id,
    content: messageText,
    is_from_contact: true,
  });

  console.log(`Instagram message processed for ticket ${ticket.id}`);
}
