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
    console.log("📨 Telegram webhook recebido:", JSON.stringify(update, null, 2));

    // Processar mensagem do Telegram
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id.toString();
      const telegramMessageId = message.message_id;
      const from = message.from;

      console.log("👤 Processando mensagem do chat:", chatId, "de:", from.username || from.first_name, "message_id:", telegramMessageId);

      // Buscar canal do Telegram configurado
      const { data: channels, error: channelsError } = await supabaseAdmin
        .from("channels")
        .select("*")
        .eq("type", "telegram")
        .eq("status", "active");

      if (channelsError) {
        console.error("❌ Erro ao buscar canais:", channelsError);
        throw channelsError;
      }

      if (!channels || channels.length === 0) {
        console.log("⚠️ Nenhum canal Telegram ativo encontrado");
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const channel = channels[0];
      const tenantId = channel.tenant_id;
      const botToken = channel.config?.bot_token;
      
      console.log("📡 Usando canal:", channel.id, "tenant:", tenantId);

      // Determinar tipo e conteúdo da mensagem
      let messageContent = "";
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;
      let fileId: string | null = null;

      if (message.text) {
        messageContent = message.text;
        console.log("💬 Mensagem de texto recebida");
      } else if (message.photo && message.photo.length > 0) {
        const photo = message.photo[message.photo.length - 1];
        fileId = photo.file_id;
        mediaType = "image";
        messageContent = message.caption || "[Imagem]";
        console.log("🖼️ Foto recebida, file_id:", fileId);
      } else if (message.audio) {
        fileId = message.audio.file_id;
        mediaType = "audio";
        messageContent = message.caption || "[Áudio]";
        console.log("🎵 Áudio recebido, file_id:", fileId);
      } else if (message.voice) {
        fileId = message.voice.file_id;
        mediaType = "audio";
        messageContent = message.caption || "[Mensagem de voz]";
        console.log("🎤 Mensagem de voz recebida, file_id:", fileId);
      } else if (message.document) {
        fileId = message.document.file_id;
        mediaType = "document";
        messageContent = message.caption || `[Documento: ${message.document.file_name || "arquivo"}]`;
        console.log("📄 Documento recebido, file_id:", fileId);
      } else if (message.sticker) {
        fileId = message.sticker.file_id;
        mediaType = "sticker";
        messageContent = message.sticker.emoji || "[Figurinha]";
        console.log("😊 Figurinha recebida, file_id:", fileId);
      } else if (message.video) {
        fileId = message.video.file_id;
        mediaType = "video";
        messageContent = message.caption || "[Vídeo]";
        console.log("🎥 Vídeo recebido, file_id:", fileId);
      } else {
        console.log("⚠️ Tipo de mensagem não suportado");
        messageContent = "[Mensagem não suportada]";
      }

      // Obter URL do arquivo se houver
      if (fileId && botToken) {
        try {
          console.log("🔄 Obtendo URL do arquivo via getFile API...");
          const fileResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
          );
          const fileData = await fileResponse.json();
          
          if (fileData.ok && fileData.result.file_path) {
            mediaUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
            console.log("✅ URL do arquivo obtida:", mediaUrl);
          } else {
            console.error("❌ Erro ao obter arquivo do Telegram:", fileData);
          }
        } catch (error) {
          console.error("❌ Exceção ao obter URL do arquivo:", error);
        }
      }

      // Buscar ou criar contato
      const contactName = from.first_name + (from.last_name ? ` ${from.last_name}` : "");
      const contactPhone = from.username ? `@${from.username}` : chatId;

      let contact;
      const { data: existingContacts } = await supabaseAdmin
        .from("contacts")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("phone", contactPhone)
        .maybeSingle();

      if (existingContacts) {
        contact = existingContacts;
        console.log("👤 Contato existente encontrado:", contact.id);
        // Atualizar status online
        await supabaseAdmin
          .from("contacts")
          .update({
            metadata: {
              ...existingContacts.metadata,
              telegram_chat_id: chatId,
              telegram_username: from.username,
              online: true,
              last_seen: new Date().toISOString(),
            },
          })
          .eq("id", contact.id);
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
              online: true,
              last_seen: new Date().toISOString(),
            },
          })
          .select()
          .single();

        if (contactError) {
          console.error("❌ Erro ao criar contato:", contactError);
          throw contactError;
        }
        contact = newContact;
        console.log("✅ Novo contato criado:", contact.id);
      }

      // Buscar ou criar ticket
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
          .update({ last_message: messageContent, updated_at: new Date().toISOString() })
          .eq("id", ticket.id);
        console.log("📋 Ticket existente atualizado:", ticket.id);
      } else {
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
          console.error("❌ Erro ao criar ticket:", ticketError);
          throw ticketError;
        }
        ticket = newTicket;
        console.log("✅ Novo ticket criado:", ticket.id);
      }

      // Criar mensagem com status "delivered"
      const { error: messageError } = await supabaseAdmin
        .from("messages")
        .insert({
          ticket_id: ticket.id,
          contact_id: contact.id,
          content: messageContent,
          is_from_contact: true,
          media_url: mediaUrl,
          media_type: mediaType,
          telegram_message_id: telegramMessageId,
          status: "delivered",
        });

      if (messageError) {
        console.error("❌ Erro ao criar mensagem:", messageError);
        throw messageError;
      }

      console.log(`✅ Mensagem processada com sucesso para o ticket ${ticket.id}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Erro ao processar webhook do Telegram:", error);
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
