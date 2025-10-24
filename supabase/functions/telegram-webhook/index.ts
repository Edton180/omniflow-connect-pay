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
      const from = message.from;

      console.log("Processando mensagem do chat:", chatId, "de:", from.username || from.first_name);

      // Determinar tipo e conteúdo da mensagem
      let messageContent = "";
      let mediaUrl = null;
      let mediaType = null;

      if (message.text) {
        messageContent = message.text;
      } else if (message.photo && message.photo.length > 0) {
        // Pegar a maior resolução da foto
        const photo = message.photo[message.photo.length - 1];
        mediaUrl = `https://api.telegram.org/file/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/${photo.file_id}`;
        mediaType = "image";
        messageContent = message.caption || "[Imagem]";
      } else if (message.audio) {
        mediaUrl = `https://api.telegram.org/file/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/${message.audio.file_id}`;
        mediaType = "audio";
        messageContent = message.caption || "[Áudio]";
      } else if (message.voice) {
        mediaUrl = `https://api.telegram.org/file/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/${message.voice.file_id}`;
        mediaType = "audio";
        messageContent = message.caption || "[Mensagem de voz]";
      } else if (message.document) {
        mediaUrl = `https://api.telegram.org/file/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/${message.document.file_id}`;
        mediaType = "document";
        messageContent = message.caption || `[Documento: ${message.document.file_name || "arquivo"}]`;
      } else if (message.sticker) {
        mediaUrl = `https://api.telegram.org/file/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/${message.sticker.file_id}`;
        mediaType = "sticker";
        messageContent = message.sticker.emoji || "[Sticker]";
      } else if (message.video) {
        mediaUrl = `https://api.telegram.org/file/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/${message.video.file_id}`;
        mediaType = "video";
        messageContent = message.caption || "[Vídeo]";
      }

      console.log("Tipo de mensagem:", mediaType || "text", "Conteúdo:", messageContent);

      // Buscar ou criar contato
      const contactName = from.first_name + (from.last_name ? ` ${from.last_name}` : "");
      const contactPhone = from.username ? `@${from.username}` : chatId;

      // Buscar canal do Telegram configurado - tentar primeiro pelo bot username se disponível
      let channel;
      let tenantId;

      // Buscar todos os canais Telegram ativos
      const { data: channels, error: channelsError } = await supabaseAdmin
        .from("channels")
        .select("*")
        .eq("type", "telegram")
        .eq("status", "active");

      if (channelsError) {
        console.error("Erro ao buscar canais:", channelsError);
        throw channelsError;
      }

      if (!channels || channels.length === 0) {
        console.log("Nenhum canal Telegram ativo encontrado");
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Se há apenas um canal, usar ele
      if (channels.length === 1) {
        channel = channels[0];
        tenantId = channel.tenant_id;
        console.log("Usando único canal Telegram encontrado:", channel.id);
      } else {
        // Se há múltiplos canais, tentar identificar pelo bot token
        // Por enquanto, usar o primeiro canal ativo
        channel = channels[0];
        tenantId = channel.tenant_id;
        console.log("Múltiplos canais encontrados, usando o primeiro:", channel.id);
      }

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
          .update({ last_message: messageContent, updated_at: new Date().toISOString() })
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
            last_message: messageContent,
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
          content: messageContent,
          is_from_contact: true,
          media_url: mediaUrl,
          media_type: mediaType,
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
