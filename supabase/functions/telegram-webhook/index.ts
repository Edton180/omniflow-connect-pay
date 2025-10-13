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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const update = await req.json();
    console.log("Telegram webhook received:", JSON.stringify(update));

    // Processar mensagem do Telegram
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id.toString();
      const text = message.text || "";
      const from = message.from;

      // Buscar ou criar contato
      const contactName = from.first_name + (from.last_name ? ` ${from.last_name}` : "");
      const contactPhone = from.username ? `@${from.username}` : chatId;

      // Buscar canal do Telegram configurado
      const { data: channels } = await supabaseAdmin
        .from("channels")
        .select("*, tenants(id)")
        .eq("type", "telegram")
        .eq("status", "active")
        .limit(1);

      if (!channels || channels.length === 0) {
        console.log("No active Telegram channel found");
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const channel = channels[0];
      const tenantId = channel.tenant_id;

      // Buscar ou criar contato
      let contact;
      const { data: existingContacts } = await supabaseAdmin
        .from("contacts")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("phone", contactPhone)
        .maybeSingle();

      if (existingContacts) {
        contact = existingContacts;
      } else {
        const { data: newContact, error: contactError } = await supabaseAdmin
          .from("contacts")
          .insert({
            tenant_id: tenantId,
            name: contactName,
            phone: contactPhone,
            metadata: {
              telegram_chat_id: chatId,
              telegram_username: from.username,
            },
          })
          .select()
          .single();

        if (contactError) {
          console.error("Error creating contact:", contactError);
          throw contactError;
        }
        contact = newContact;
      }

      // Buscar ticket aberto para este contato
      let ticket;
      const { data: existingTickets } = await supabaseAdmin
        .from("tickets")
        .select("*")
        .eq("contact_id", contact.id)
        .in("status", ["open", "in_progress", "pending"])
        .maybeSingle();

      if (existingTickets) {
        ticket = existingTickets;
        
        // Atualizar última mensagem
        await supabaseAdmin
          .from("tickets")
          .update({ last_message: text, updated_at: new Date().toISOString() })
          .eq("id", ticket.id);
      } else {
        // Criar novo ticket
        const { data: newTicket, error: ticketError } = await supabaseAdmin
          .from("tickets")
          .insert({
            tenant_id: tenantId,
            contact_id: contact.id,
            channel: "telegram",
            status: "open",
            priority: "medium",
            last_message: text,
          })
          .select()
          .single();

        if (ticketError) {
          console.error("Error creating ticket:", ticketError);
          throw ticketError;
        }
        ticket = newTicket;
      }

      // Criar mensagem
      await supabaseAdmin
        .from("messages")
        .insert({
          ticket_id: ticket.id,
          contact_id: contact.id,
          content: text,
          is_from_contact: true,
        });

      console.log(`Message processed for ticket ${ticket.id}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing Telegram webhook:", error);
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
