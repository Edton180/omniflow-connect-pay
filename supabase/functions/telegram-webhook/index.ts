import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para verificar horário de atendimento
function isWithinBusinessHours(businessHours: any): boolean {
  if (!businessHours?.enabled) return true;
  
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = domingo, 1 = segunda, etc
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const daySchedule = businessHours[dayNames[dayOfWeek]];
  
  if (!daySchedule?.enabled) return false;
  
  const [startHour, startMin] = daySchedule.start.split(':').map(Number);
  const [endHour, endMin] = daySchedule.end.split(':').map(Number);
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  return currentTime >= startTime && currentTime <= endTime;
}

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
      const chatbotConfig = channel.chatbot_config || {};
      
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

      // Obter URL do arquivo se houver e fazer upload para Supabase Storage
      if (fileId && botToken) {
        try {
          console.log("🔄 Obtendo arquivo via getFile API...");
          const fileResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
          );
          const fileData = await fileResponse.json();
          
          if (fileData.ok && fileData.result.file_path) {
            const telegramFileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
            console.log("✅ URL do arquivo obtida, fazendo download...");
            
            // Fazer download do arquivo
            const downloadResponse = await fetch(telegramFileUrl);
            const fileBlob = await downloadResponse.blob();
            const fileBuffer = await fileBlob.arrayBuffer();
            
            // Determinar extensão do arquivo
            const filePath = fileData.result.file_path;
            const fileExtension = filePath.split('.').pop() || 'bin';
            const fileName = `telegram_${Date.now()}_${fileId}.${fileExtension}`;
            const storagePath = `telegram-media/${tenantId}/${fileName}`;
            
            console.log("📤 Fazendo upload para Supabase Storage:", storagePath);
            
            // Upload para Supabase Storage
            const { data: uploadData, error: uploadError } = await supabaseAdmin
              .storage
              .from('tickets-media')
              .upload(storagePath, fileBuffer, {
                contentType: downloadResponse.headers.get('content-type') || 'application/octet-stream',
                upsert: false
              });
            
            if (uploadError) {
              console.error("❌ Erro ao fazer upload:", uploadError);
              // Fallback para URL do Telegram (temporário)
              mediaUrl = telegramFileUrl;
            } else {
              // Obter URL pública
              const { data: publicUrlData } = supabaseAdmin
                .storage
                .from('tickets-media')
                .getPublicUrl(storagePath);
              
              mediaUrl = publicUrlData.publicUrl;
              console.log("✅ Arquivo salvo no Storage:", mediaUrl);
            }
          } else {
            console.error("❌ Erro ao obter arquivo do Telegram:", fileData);
          }
        } catch (error) {
          console.error("❌ Exceção ao processar arquivo:", error);
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

      // Verificar se é resposta de avaliação
      const isEvaluationResponse = message.text && /^[1-5]$/.test(message.text.trim());
      
      // Buscar ticket mais recente do contato (incluindo fechados recentes para avaliação)
      const { data: recentTickets } = await supabaseAdmin
        .from("tickets")
        .select("*, bot_state")
        .eq("contact_id", contact.id)
        .order("updated_at", { ascending: false })
        .limit(1);
      
      const mostRecentTicket = recentTickets?.[0];
      
      // Se for resposta de avaliação e o ticket mais recente foi fechado recentemente (últimas 2 horas)
      if (isEvaluationResponse && mostRecentTicket?.status === "closed") {
        const closedAt = new Date(mostRecentTicket.closed_at);
        const now = new Date();
        const hoursSinceClosed = (now.getTime() - closedAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceClosed < 2) {
          console.log("⭐ Resposta de avaliação detectada:", message.text);
          
          // Salvar avaliação
          const score = parseInt(message.text.trim());
          const { error: evalError } = await supabaseAdmin
            .from("evaluations")
            .insert({
              ticket_id: mostRecentTicket.id,
              contact_id: contact.id,
              agent_id: mostRecentTicket.assigned_to,
              tenant_id: tenantId,
              score: score,
            });
          
          if (evalError) {
            console.error("❌ Erro ao salvar avaliação:", evalError);
          } else {
            console.log("✅ Avaliação salva com sucesso");
            
            // Atualizar ticket com nota
            await supabaseAdmin
              .from("tickets")
              .update({ 
                evaluation_score: score,
                evaluated_at: new Date().toISOString()
              })
              .eq("id", mostRecentTicket.id);
            
            // Buscar mensagem de agradecimento
            const { data: evalSettings } = await supabaseAdmin
              .from("evaluation_settings")
              .select("thank_you_message")
              .eq("tenant_id", tenantId)
              .maybeSingle();
            
            const thankYouMessage = evalSettings?.thank_you_message || "Obrigado pela sua avaliação!";
            
            // Enviar mensagem de agradecimento
            try {
              await supabaseAdmin.functions.invoke("send-telegram-media", {
                body: {
                  chatId: chatId,
                  message: thankYouMessage,
                },
              });
              console.log("✅ Mensagem de agradecimento enviada");
            } catch (err) {
              console.error("❌ Erro ao enviar agradecimento:", err);
            }
          }
          
          // Retornar sem criar novo ticket
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
      
      // Buscar ou criar ticket (apenas tickets abertos)
      let ticket;
      let isNewTicket = false;
      const { data: existingTickets } = await supabaseAdmin
        .from("tickets")
        .select("*, bot_state")
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
        isNewTicket = true;
        const { data: newTicket, error: ticketError } = await supabaseAdmin
          .from("tickets")
          .insert({
            tenant_id: tenantId,
            contact_id: contact.id,
            channel: "telegram",
            status: "open",
            priority: "medium",
            last_message: messageContent,
            bot_state: { step: "initial", timestamp: new Date().toISOString() }
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

      // Lógica do bot: Verificar horário de atendimento primeiro
      if (!isWithinBusinessHours(chatbotConfig.business_hours)) {
        console.log("⏰ Fora do horário de atendimento");
        if (chatbotConfig.offline_message && isNewTicket) {
          try {
            await supabaseAdmin.functions.invoke("send-auto-message", {
              body: {
                channelId: channel.id,
                contactId: contact.id,
                ticketId: ticket.id,
                messageType: "outside_hours",
              },
            });
          } catch (autoError) {
            console.error("⚠️ Erro ao enviar mensagem de horário:", autoError);
          }
        }
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Verificar se há menu ativo (PRIORIDADE sobre chatbot)
      const { data: activeMenu } = await supabaseAdmin
        .from("channel_menus")
        .select("*, menu_items(*)")
        .eq("channel_id", channel.id)
        .eq("is_active", true)
        .maybeSingle();

      // Novo ticket: enviar saudação + menu
      if (isNewTicket) {
        console.log("🤖 Novo ticket detectado");
        
        try {
          if (activeMenu) {
            // MENU ATIVO: usar saudação do menu
            console.log("📋 Menu ativo encontrado:", activeMenu.name);
            
            // Enviar saudação do menu
            if (activeMenu.greeting_message) {
              await supabaseAdmin.functions.invoke("send-telegram-media", {
                body: {
                  chatId: chatId,
                  message: activeMenu.greeting_message,
                },
              });
              
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Construir e enviar opções do menu
            if (activeMenu.menu_items && activeMenu.menu_items.length > 0) {
              const menuText = activeMenu.menu_items
                .filter((item: any) => item.is_active)
                .sort((a: any, b: any) => a.position - b.position)
                .map((item: any) => `${item.option_key} - ${item.option_label}`)
                .join('\n');
              
              if (menuText) {
                await supabaseAdmin.functions.invoke("send-telegram-media", {
                  body: {
                    chatId: chatId,
                    message: menuText,
                  },
                });
              }
              
              // Atualizar estado do bot para aguardar resposta do menu
              await supabaseAdmin
                .from("tickets")
                .update({ 
                  bot_state: { 
                    step: "awaiting_menu_response", 
                    menu_id: activeMenu.id,
                    timestamp: new Date().toISOString() 
                  }
                })
                .eq("id", ticket.id);
            }
          } else if (chatbotConfig.is_active) {
            // CHATBOT ATIVO (sem menu): usar saudação do chatbot
            console.log("🤖 Chatbot ativo (sem menu)");
            
            await supabaseAdmin.functions.invoke("send-auto-message", {
              body: {
                channelId: channel.id,
                contactId: contact.id,
                ticketId: ticket.id,
                messageType: "greeting",
              },
            });
            
            // Atualizar estado
            await supabaseAdmin
              .from("tickets")
              .update({ 
                bot_state: { 
                  step: "greeted", 
                  timestamp: new Date().toISOString() 
                }
              })
              .eq("id", ticket.id);
          }
        } catch (autoError) {
          console.error("⚠️ Erro ao enviar mensagens automáticas:", autoError);
        }
      } else if (ticket.bot_state?.step === "awaiting_menu_response" && message.text && activeMenu) {
        // Processar resposta do menu
        console.log("🔄 Processando resposta do menu:", message.text);
        
        const selectedItem = activeMenu.menu_items?.find(
          (item: any) => item.option_key === message.text.trim() && item.is_active
        );
        
        if (selectedItem) {
          console.log("✅ Opção válida selecionada:", selectedItem.option_label);
          
          // Verificar se é encaminhamento para fila (aceitar ambos os valores)
          const isQueueAction = selectedItem.action_type === "queue" || 
                                selectedItem.action_type === "forward_to_queue";
          
          if (isQueueAction && selectedItem.target_id) {
            console.log("🎯 Atribuindo ticket à fila:", selectedItem.target_id);
            
            // Buscar informações da fila incluindo mensagem customizável
            const { data: queueData } = await supabaseAdmin
              .from("queues")
              .select("name, routing_message")
              .eq("id", selectedItem.target_id)
              .single();
            console.log("🎯 Fila encontrada:", queueData?.name || "N/A");
            
            // Atribuir à fila
            const { error: updateError } = await supabaseAdmin
              .from("tickets")
              .update({ 
                queue_id: selectedItem.target_id,
                bot_state: { 
                  step: "routed", 
                  timestamp: new Date().toISOString() 
                }
              })
              .eq("id", ticket.id);
            
            if (updateError) {
              console.error("❌ Erro ao atribuir fila:", updateError);
            } else {
              console.log(`✅ Ticket atribuído à fila: ${queueData?.name || selectedItem.target_id}`);
              
              // Mensagem configurável da fila
              let routingMessage = queueData?.routing_message || 'Você foi direcionado para: {queue_name}';
              routingMessage = routingMessage.replace('{queue_name}', selectedItem.option_label);
              
              // Confirmar ao usuário
              await supabaseAdmin.functions.invoke("send-telegram-media", {
                body: {
                  chatId: chatId,
                  message: routingMessage,
                },
              });
            }
          } else if (selectedItem.action_type === "message" && selectedItem.target_data?.message) {
            // Enviar mensagem configurada
            try {
              await supabaseAdmin.functions.invoke("send-telegram-media", {
                body: {
                  chatId: chatId,
                  message: selectedItem.target_data.message,
                },
              });
            } catch (err) {
              console.error("⚠️ Erro ao enviar mensagem:", err);
            }
          } else if (selectedItem.action_type === "submenu") {
            // Implementar lógica de submenu aqui se necessário
            console.log("📋 Submenu solicitado");
          }
        } else {
          console.log("⚠️ Opção inválida recebida:", message.text);
        }
      }
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
